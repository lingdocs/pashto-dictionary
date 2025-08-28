import { Router } from "express";
import { PassportStatic } from "passport";
import {
  deleteLingdocsUser,
  getAllFeedback,
  getAllLingdocsUsers,
  getLingdocsUser,
  updateLingdocsUser,
} from "../lib/couch-db";
import {
  createNewUser,
  canRemoveOneOutsideProvider,
  downgradeUser,
} from "../lib/user-utils";
import {
  getHash,
  getURLToken,
  compareToHash,
  getEmailTokenAndHash,
} from "../lib/password-utils";
import { upgradeUser, denyUserUpgradeRequest } from "../lib/user-utils";
import { validateReCaptcha } from "../lib/recaptcha";
import { getTimestamp } from "../lib/time-utils";
import {
  getAddress,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../lib/mail-utils";
import { outsideProviders } from "../middleware/setup-passport";
import inProd from "../lib/inProd";
import * as T from "../../../website/src/types/account-types";

const authRouter = (passport: PassportStatic) => {
  const router = Router();

  router.get("/", (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect("/user");
    }
    res.render("login", { recaptcha: "", inProd });
  });

  router.get("/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/");
    }
    res.render("user", {
      user: req.user,
      error: null,
      removeProviderOption: canRemoveOneOutsideProvider(req.user),
    });
  });

  router.get("/delete-account", (req, res) => {
    res.render("delete-account", {
      user: req.user,
      error: null,
    });
  });

  router.post("/user", async (req, res, next) => {
    const page = "user";
    if (!req.user) return next("user not found");
    const name = req.body.name as string;
    const email = req.body.email as string;
    if (email !== req.user.email) {
      if (name !== req.user.name)
        await updateLingdocsUser(req.user.userId, { name });
      const withSameEmail =
        email !== "" && (await getLingdocsUser("email", email));
      if (withSameEmail) {
        return res.render(page, {
          user: { ...req.user, email },
          error: "email taken",
          removeProviderOption: canRemoveOneOutsideProvider(req.user),
        });
      }
      // TODO: ABSTRACT THE PROCESS OF GETTING A NEW EMAIL TOKEN AND MAILING!
      const { token, hash } = await getEmailTokenAndHash();
      const updated = await updateLingdocsUser(req.user.userId, {
        name,
        email,
        emailVerified: hash,
      });
      // TODO: AWAIT THE E-MAIL SEND TO MAKE SURE THE E-MAIL WORKS!
      sendVerificationEmail({
        name: updated.name,
        uid: updated.userId,
        email: updated.email || "",
        token,
      });
      return res.render(page, {
        user: updated,
        error: null,
        removeProviderOption: canRemoveOneOutsideProvider(req.user),
      });
    }
    const updated = await updateLingdocsUser(req.user.userId, { name });
    // need to do this because sometimes the update seems slow?
    return res.render(page, {
      user: updated,
      error: null,
      removeProviderOption: canRemoveOneOutsideProvider(req.user),
    });
  });

  router.post("/login", async (req, res, next) => {
    if (inProd) {
      const success = await validateReCaptcha(req.body.token);
      if (!success) {
        return res.render("login", { recaptcha: "fail", inProd });
      }
    }
    passport.authenticate(
      "local",
      // TODO: type the info param according to the passport local setup
      (err: any, user: T.LingdocsUser | undefined, info: any) => {
        if (err) throw err;
        if (!user && info.message === "email not found") {
          return res.send({ ok: false, newSignup: true });
        }
        if (!user)
          res.send({
            ok: false,
            message: "Incorrect password",
          });
        else {
          req.logIn(user, (err) => {
            if (err) return next(err);
            res.send({ ok: true, user });
          });
        }
      },
    )(req, res, next);
  });

  router.get(
    "/google",
    passport.authenticate("google", {
      // @ts-ignore - needed for getting refreshToken]
      accessType: "offline",
      scope: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    }),
  );
  router.get(
    "/github",
    passport.authenticate("github", {
      scope: ["read:user", "user:email"],
    }),
  );
  router.get("/twitter", passport.authenticate("twitter"));

  // all callback and remove routes/functions are the same for each provider
  outsideProviders.forEach((provider) => {
    router.get(
      `/${provider}/callback`,
      passport.authenticate(provider, {
        successRedirect: "/user",
        failureRedirect: "/",
      }),
    );
    router.post(`/${provider}/remove`, async (req, res, next) => {
      try {
        if (!req.user) return next("user not found");
        if (!canRemoveOneOutsideProvider(req.user))
          return res.redirect("/user");
        await updateLingdocsUser(
          req.user.userId,
          // @ts-ignore - shouldn't need this
          { [provider]: undefined },
        );
        return res.redirect("/user");
      } catch (e) {
        next(e);
      }
    });
  });

  router.post("/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      const existingUser = await getLingdocsUser("email", email);
      if (existingUser)
        return res.send({ ok: false, message: "User Already Exists" });
      try {
        const user = await createNewUser({
          strategy: "local",
          email,
          passwordPlainText: password,
          name,
        });
        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.send({ ok: true, user });
        });
      } catch (e) {
        console.error(e);
        return res.send({ ok: false, message: "Invalid E-mail" });
      }
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin", async (req, res, next) => {
    try {
      if (!req.user || !req.user.admin) {
        return res.redirect("/");
      }
      const users = (await getAllLingdocsUsers()).sort(
        (a, b) => (a.accountCreated || 0) - (b.accountCreated || 0),
      );
      const tests = getTestCompletionSummary(users);
      res.render("admin", { users, tests });
    } catch (e) {
      next(e);
    }
  });

  router.get("/grammar-feedback", async (req, res, next) => {
    try {
      if (!req.user || !req.user.admin) {
        return res.redirect("/");
      }
      const docs = await getAllFeedback();
      res.render("grammar-feedback", { docs });
    } catch (e) {
      next(e);
    }
  });

  router.get("/privacy", (req, res) => {
    res.render("privacy");
  });

  /**
   * Grant request for upgrade to student
   */
  router.post(
    "/admin/upgradeToStudent/:userId/:grantOrDeny",
    async (req, res, next) => {
      try {
        if (!req.user || !req.user.admin) {
          return res.redirect("/");
        }
        const userId = req.params.userId as T.UUID;
        const grantOrDeny = req.params.grantOrDeny as "grant" | "deny";
        if (grantOrDeny === "grant") {
          await upgradeUser(userId);
        } else {
          await denyUserUpgradeRequest(userId);
        }
        res.redirect("/admin");
      } catch (e) {
        next(e);
      }
    },
  );

  router.post("/downgradeToBasic", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.send({ ok: false, error: "user not logged in" });
      }
      const subscription =
        "subscription" in req.user ? req.user.subscription : undefined;
      await downgradeUser(
        req.user.userId,
        subscription ? subscription.id : undefined,
      );
      res.send({
        ok: true,
        message: `account downgraded to basic${
          subscription ? " and subscription cancelled" : ""
        }`,
      });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/admin/:userId", async (req, res, next) => {
    try {
      // TODO: MAKE PROPER MIDDLEWARE WITH TYPING
      if (!req.user || !req.user.admin) {
        return res.redirect("/");
      }
      const toDelete = req.params.userId as T.UUID;
      await deleteLingdocsUser(toDelete);
      res.send({ ok: true, message: "user deleted" });
    } catch (e) {
      next(e);
    }
  });

  router.get("/email-verification/:uuid/:token", async (req, res, next) => {
    const page = "email-verification";
    const { uuid, token } = req.params;
    try {
      const user = await getLingdocsUser("userId", uuid);
      if (!user) {
        return res.render(page, { ok: false, message: "not found" });
      }
      if (user.emailVerified === true) {
        return res.render(page, { ok: true, message: "already verified" });
      }
      if (user.emailVerified === false) {
        return res.render(page, { ok: false, message: "invalid token" });
      }
      const result = await compareToHash(token, user.emailVerified);
      if (result === true) {
        await updateLingdocsUser(user.userId, { emailVerified: true });
        return res.render(page, { ok: true, message: "verified" });
      } else {
        res.render(page, { ok: false, message: "invalid token" });
      }
    } catch (e) {
      return res.render(page, { ok: false, message: "error verifying e-mail" });
    }
  });

  router.get("/password-reset", (req, res) => {
    const email = req.query.email || "";
    res.render("password-reset-request", { email, done: false });
  });

  router.post("/password-reset", async (req, res, next) => {
    const page = "password-reset-request";
    const email = req.body.email || "";
    try {
      const user = await getLingdocsUser("email", email);
      if (!user) {
        console.log("password reset attempt on non-existant e-mail");
        return res.render(page, { email, done: false });
      }
      if (user.emailVerified !== true) {
        console.log("password reset attempt on an unverified e-mail");
        return res.render(page, { email, done: false });
      }
      // TODO: SHOULD THIS BE NOT ALLOWED?
      // TODO: PROPER ERROR MESSAGING IN ALL THIS!!
      if (!user.password) {
        console.log("password reset attempt on an account without a password");
        return res.render(page, { email, done: false });
      }
      const token = getURLToken();
      const tokenHash = await getHash(token);
      const u = await updateLingdocsUser(user.userId, {
        passwordReset: { tokenHash, requestedOn: getTimestamp() },
      });
      await sendPasswordResetEmail(u, token);
      return res.render(page, { email, done: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/password-reset/:uuid/:token", async (req, res, next) => {
    const page = "password-reset";
    const { uuid, token } = req.params;
    const user = await getLingdocsUser("userId", uuid);
    if (!user || !user.passwordReset) {
      return res.render(page, { ok: false, user: null, message: "not found" });
    }
    // TODO: ALSO CHECK IF THE RESET IS FRESH ENOUGH
    const result = await compareToHash(token, user.passwordReset.tokenHash);
    if (result === true) {
      return res.render(page, { ok: true, user, token, message: "" });
    } else {
      res.render(page, { ok: false, user: null, message: "invalid token" });
    }
  });

  router.post("/password-reset/:uuid/:token", async (req, res, next) => {
    const page = "password-reset";
    const { uuid, token } = req.params;
    const { password, passwordConfirmed } = req.body;
    const user = await getLingdocsUser("userId", uuid);
    if (!user || !user.passwordReset) {
      return res.render(page, { ok: false, message: "not found" });
    }
    const result = await compareToHash(token, user.passwordReset.tokenHash);
    if (!result)
      return res.render(page, {
        ok: false,
        user: null,
        message: "invalid token",
      });
    const passwordsMatch = password === passwordConfirmed;
    if (passwordsMatch) {
      const hash = await getHash(password);
      await updateLingdocsUser(user.userId, { password: hash });
      return res.render(page, { ok: true, user, message: "password reset" });
    } else {
      return res.render(page, {
        ok: false,
        user,
        message: "passwords don't match",
      });
    }
  });

  router.post("/sign-out", (req, res) => {
    req.logOut((err: any) => {
      console.error(err);
    });
    res.redirect("/");
  });

  return router;
};

function getTestCompletionSummary(users: T.LingdocsUser[]) {
  const tests: { id: string; passes: number; fails: number }[] = [];
  users.forEach((u) => {
    const usersTests = removeDuplicateTests(u.tests);
    usersTests.forEach((ut) => {
      const ti = tests.findIndex((x) => x.id === ut.id);
      if (ti === -1) {
        tests.push({
          id: ut.id,
          ...(ut.done ? { passes: 1, fails: 0 } : { passes: 0, fails: 1 }),
        });
      } else tests[ti][ut.done ? "passes" : "fails"]++;
    });
  });
  return tests;
}

function removeDuplicateTests(tests: T.TestResult[]): T.TestResult[] {
  return tests.reduceRight(
    (acc, curr) => {
      const redundant = acc.filter(
        (x) => x.id === curr.id && x.done === curr.done,
      );
      return redundant.length ? acc : [...acc, curr];
    },
    [...tests],
  );
}

// function getTestCompletionSummary(users: T.LingdocsUser[]) {
//   const tests: { id: string, passes: number }[] = [];
//   users.forEach(u => (
//     Array.from(new Set(u.tests.map(x => x.id))).forEach(id => {
//       const ti = tests.findIndex(x => x.id === id);
//       if (ti > -1) tests[ti].passes++;
//       else tests.push({ id, passes: 1 });
//     })
//   ));
//   return tests;
// }

export default authRouter;
