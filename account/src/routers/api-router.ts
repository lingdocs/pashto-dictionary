import express, { Response } from "express";
import {
    deleteLingdocsUser,
    getLingdocsUser,
    updateLingdocsUser,
    addCouchDbAuthUser,
    deleteCouchDbAuthUser,
} from "../lib/couch-db";
import {
    getHash,
    compareToHash,
    getEmailTokenAndHash,
} from "../lib/password-utils";
import {
    sendVerificationEmail,
} from "../lib/mail-utils";
import * as T from "../../../website/src/lib/account-types";
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
 * receives a request to change or add a user's own password
 */
apiRouter.post("/password", async (req, res, next) => {
    if (!req.user) return next("user not found");
    const { oldPassword, password, passwordConfirmed } = req.body;
    const addingFirstPassword = !req.user.password;
    if (!oldPassword && !addingFirstPassword) {
        return sendResponse(res, { ok: false, error: "Please enter your old password" });
    }
    if (!password) {
        return sendResponse(res, { ok: false, error: "Please enter a new password" });
    }
    if (!req.user.email) {
        return sendResponse(res, { ok: false, error: "You need to add an e-mail address first" });
    }
    if (req.user.password) {
        const matchedOld = await compareToHash(oldPassword, req.user.password) || !req.user.password;
        if (!matchedOld) {
            return sendResponse(res, { ok: false, error: "Incorrect old password" });
        }
    }
    if (password !== passwordConfirmed) {
        return sendResponse(res, { ok: false, error: "New passwords do not match" });
    }
    if (password.length < 6) {
        return sendResponse(res, {ok: false, error: "New password too short" });
    }
    const hash = await getHash(password);
    await updateLingdocsUser(req.user.userId, { password: hash });
    sendResponse(res, { ok: true, message: addingFirstPassword ? "Password added" : "Password changed" });
});

/**
 * receives a request to generate a new e-mail verification token and send e-mail 
 */
apiRouter.put("/email-verification", async (req, res, next) => {
    try {
        if (!req.user) throw new Error("user not found");
        const { token, hash } = await getEmailTokenAndHash();
        const u = await updateLingdocsUser(req.user.userId, { emailVerified: hash });
        sendVerificationEmail(u, token).then(() => {
            sendResponse(res, { ok: true, message: "e-mail verification sent" });
        }).catch((err) => {
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
        // add user to couchdb authentication db
        const { password, userDbName } = await addCouchDbAuthUser(userId);
        // // create user db
        // const { name } = await createWordlistDatabase(userId, password);
        // update LingdocsUser
        const u = await updateLingdocsUser(userId, { level: "student", wordlistDbName: userDbName, userDbPassword: password });
        const upgraded: T.UpgradeUserResponse = {
            ok: true,
            message: "user upgraded to student",
            user: u,
        };
        res.send(upgraded);
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
        // await deleteWordlistDatabase(req.user.userId);
        await deleteCouchDbAuthUser(req.user.userId);
        await deleteLingdocsUser(req.user.userId);
        sendResponse(res, { ok: true, message: "user deleted" });
    } catch (e) {
        next(e);
    }
})

/**
 * signs out the user signed in
 */
apiRouter.post("/sign-out" , (req, res) => {
    req.logOut();
    sendResponse(res, { ok: true, message: "signed out" });
});

export default apiRouter;