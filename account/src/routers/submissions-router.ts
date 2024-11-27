import express, { Response } from "express";
import * as T from "../../../website/src/types/account-types";
import { receiveSubmissions } from "../lib/submissions";
import { google } from "googleapis";
import {
  getEntriesFromSheet,
  Sheets,
} from "../../../functions/lib/spreadsheet-tools";
import env from "../lib/env-vars";

// TODO: ADD PROPER ERROR HANDLING THAT WILL RETURN JSON ALWAYS

function sendResponse(res: Response, payload: T.APIResponse) {
  return res.send(payload);
}

const submissionsRouter = express.Router();

const auth = new google.auth.GoogleAuth({
  // TODO: THESE CREDENTIALS ARE NOT WORKING SOMEHOW !!
  credentials: {
    private_key: Buffer.from(env.lingdocsServiceAccountKey, "base64").toString(
      "ascii"
    ),
    client_email: env.lingdocsServiceAccountEmail,
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
});
const { spreadsheets } = google.sheets({
  version: "v4",
  auth,
});
const sheets: Sheets = {
  spreadsheetId: env.lingdocsDictionarySpreadsheet,
  spreadsheets,
};

submissionsRouter.get("/", async (req, res, next) => {
  const r = await getEntriesFromSheet(sheets);
  res.send(r);
});

// Guard all api with authentication
submissionsRouter.use((req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  const r: T.APIResponse = { ok: false, error: "401 Unauthorized" };
  return res.status(401).send(r);
});

/**
 * Receive a submissions request from the dictionary app
 */
submissionsRouter.post("/", async (req, res, next) => {
  if (!req.user) return next("user not found");
  const r = await receiveSubmissions(req.body, !!req.user.admin);
  sendResponse(res, r);
});

export default submissionsRouter;
