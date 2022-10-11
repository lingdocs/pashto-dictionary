import express, { Response } from "express";
import * as T from "../../../website/src/types/account-types";
import { addFeedback } from "../lib/couch-db";
// import env from "../lib/env-vars";

// TODO: ADD PROPER ERROR HANDLING THAT WILL RETURN JSON ALWAYS

function sendResponse(res: Response, payload: T.APIResponse) {
    return res.send(payload);
}

const feedbackRouter = express.Router();

/**
 * receives a piece of feedback
 */
feedbackRouter.put("/", (req, res, next) => {
    if (!req.user) {
        addFeedback({
            user: req.user,
            feedback: req.body,
        });
    }
    // @ts-ignore;
    sendResponse(res, { ok: true, message: "feedback received" });
});

export default feedbackRouter;
