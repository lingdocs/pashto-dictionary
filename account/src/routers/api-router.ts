import express, { Response } from "express";
import {
  deleteLingdocsUser,
  getLingdocsUser,
  updateLingdocsUser,
} from "../lib/couch-db";
import {
  getHash,
  compareToHash,
  getEmailTokenAndHash,
} from "../lib/password-utils";
import {
  sendUpgradeRequestToAdmin,
  sendVerificationEmail,
} from "../lib/mail-utils";
import { upgradeUser } from "../lib/user-utils";
import * as T from "../../../website/src/types/account-types";
import env from "../lib/env-vars";

// TODO: ADD PROPER ERROR HANDLING THAT WILL RETURN JSON ALWAYS

function sendResponse(res: Response, payload: T.APIResponse) {
  return res.send(payload);
}

const apiRouter = express.Router();

// Guard all api with authentication
apiRouter.use((req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  const r: T.APIResponse = { ok: false, error: "401 Unauthorized" };
  return res.status(401).send(r);
});

/**
 * gets the LingdocsUser object for the user signed in
 */
apiRouter.get("/user", (req, res, next) => {
  if (!req.user) return next("user not found");
  sendResponse(res, { ok: true, user: req.user });
});

/**
 * adds (passed) test results to the record of the user signed in
 */
apiRouter.put("/user/tests", async (req, res, next) => {
  if (!req.user) return next("user not found");
  try {
    const { tests } = req.body as T.PostTestResultsBody;
    await updateLingdocsUser(req.user.userId, { tests });
    sendResponse(res, {
      ok: true,
      message: "posted test results",
      tests,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * receives a request to change or add a user's own password
 */
apiRouter.post("/password", async (req, res, next) => {
  if (!req.user) return next("user not found");
  const { oldPassword, password, passwordConfirmed } = req.body;
  const addingFirstPassword = !req.user.password;
  if (!oldPassword && !addingFirstPassword) {
    return sendResponse(res, {
      ok: false,
      error: "Please enter your old password",
    });
  }
  if (!password) {
    return sendResponse(res, {
      ok: false,
      error: "Please enter a new password",
    });
  }
  if (!req.user.email) {
    return sendResponse(res, {
      ok: false,
      error: "You need to add an e-mail address first",
    });
  }
  if (req.user.password) {
    const matchedOld =
      (await compareToHash(oldPassword, req.user.password)) ||
      !req.user.password;
    if (!matchedOld) {
      return sendResponse(res, { ok: false, error: "Incorrect old password" });
    }
  }
  if (password !== passwordConfirmed) {
    return sendResponse(res, {
      ok: false,
      error: "New passwords do not match",
    });
  }
  if (password.length < 6) {
    return sendResponse(res, { ok: false, error: "New password too short" });
  }
  const hash = await getHash(password);
  await updateLingdocsUser(req.user.userId, { password: hash });
  sendResponse(res, {
    ok: true,
    message: addingFirstPassword ? "Password added" : "Password changed",
  });
});

/**
 * receives a request to generate a new e-mail verification token and send e-mail
 */
apiRouter.put("/email-verification", async (req, res, next) => {
  try {
    if (!req.user) throw new Error("user not found");
    const { token, hash } = await getEmailTokenAndHash();
    const u = await updateLingdocsUser(req.user.userId, {
      emailVerified: hash,
    });
    sendVerificationEmail({
      name: u.name,
      uid: u.userId,
      email: u.email || "",
      token,
    })
      .then(() => {
        sendResponse(res, { ok: true, message: "e-mail verification sent" });
      })
      .catch((err) => {
        sendResponse(res, { ok: false, error: err });
      });
  } catch (e) {
    next(e);
  }
});

apiRouter.put("/user/upgrade", async (req, res, next) => {
  if (!req.user) throw new Error("user not found");
  try {
    const givenPassword = (req.body.password || "") as string;
    const studentPassword = env.upgradePassword;
    if (givenPassword.toLowerCase().trim() !== studentPassword.toLowerCase()) {
      const wrongPass: T.UpgradeUserResponse = {
        ok: false,
        error: "incorrect password",
      };
      res.send(wrongPass);
      return;
    }
    const { userId } = req.user;
    const user = await getLingdocsUser("userId", userId);
    if (!user) throw new Error("user lost");
    if (user.level !== "basic") {
      const alreadyUpgraded: T.UpgradeUserResponse = {
        ok: true,
        message: "user already upgraded",
        user,
      };
      res.send(alreadyUpgraded);
      return;
    }
    const upgraded: T.UpgradeUserResponse = await upgradeUser(userId);
    res.send(upgraded);
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/user/upgradeToStudentRequest", async (req, res, next) => {
  if (!req.user) throw new Error("user not found");
  try {
    if (req.user.level === "student" || req.user.level === "editor") {
      res.send({ ok: true, message: "user already upgraded" });
      return;
    }
    sendUpgradeRequestToAdmin(req.user).catch(console.error);
    await updateLingdocsUser(req.user.userId, {
      upgradeToStudentRequest: "waiting",
    });
    res.send({ ok: true, message: "request for upgrade sent" });
  } catch (e) {
    next(e);
  }
});

/**
 * deletes a users own account
 */
apiRouter.delete("/user", async (req, res, next) => {
  try {
    if (!req.user) throw new Error("user not found");
    await deleteLingdocsUser(req.user.userId);
    sendResponse(res, { ok: true, message: "user deleted" });
  } catch (e) {
    next(e);
  }
});

/**
 * signs out the user signed in
 */
apiRouter.post("/sign-out", (req, res) => {
  req.logOut();
  sendResponse(res, { ok: true, message: "signed out" });
});

export default apiRouter;
