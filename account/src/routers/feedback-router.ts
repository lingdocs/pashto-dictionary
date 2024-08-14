import express, { Response } from "express";
import * as T from "../../../website/src/types/account-types";
import { addFeedback } from "../lib/couch-db";
import { ntfy } from "../lib/ntfy";
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
  const { anonymous, ...feedback } = req.body;
  const user = anonymous
    ? "anonymous"
    : req.user
    ? req.user.name
    : "not logged in";
  addFeedback({
    user,
    feedback,
  })
    .then(() => {
      ntfy(JSON.stringify(feedback));
      res.send({ ok: true, message: "feedback received" });
    })
    .catch((e) => {
      console.error("error receiving feedback");
      console.error("feedback missed", feedback);
      console.error(e);
      next("error receiving feedback");
    });
});

export default feedbackRouter;
