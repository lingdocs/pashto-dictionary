import Nano from "nano";
import * as FT from "../../../website/src/types/functions-types";
import {
  addDictionaryEntries,
  deleteEntry,
  Sheets,
  updateDictionaryEntries,
} from "../../../functions/lib/spreadsheet-tools";
import { google } from "googleapis";
import env from "./env-vars";

const sheetId = parseInt(env.lingdocsDictionarySheetId);
if (isNaN(sheetId)) {
  console.error("Invalid SheetID for LINGDOCS_DICTIONARY_SHEET_ID env var");
  process.exit(1);
}
const nano = Nano(env.couchDbURL);
const reviewTasksDb = nano.db.use("review-tasks");

// TODO: get new env vars on server (remember base64 for key)

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

export async function receiveSubmissions(
  e: FT.SubmissionsRequest,
  editor: boolean
): Promise<FT.SubmissionsResponse> {
  const { edits, reviewTasks } = sortSubmissions(e);

  // TODO: guard against race conditions update!!

  // TODO: BETTER PROMISE MULTI-TASKING
  // 1. Add review tasks to the couchdb
  // 2. Edit dictionary entries
  // 3. Add new dictionary entries

  if (reviewTasks.length) {
    const docs = reviewTasks.map((task) => ({
      ...task,
      _rev: undefined,
    }));
    await reviewTasksDb.bulk({ docs });
  }

  if (edits.length && editor) {
    const { newEntries, entryEdits, entryDeletions } = sortEdits(edits);
    await updateDictionaryEntries(sheets, entryEdits);
    for (const ed of entryDeletions) {
      await deleteEntry(sheets, sheetId, ed);
    }
    await addDictionaryEntries(sheets, newEntries);
  }

  return {
    ok: true,
    message: `received ${reviewTasks.length} review task(s), and ${edits.length} edit(s)`,
    submissions: e,
  };
}

type SortedSubmissions = {
  edits: FT.Edit[];
  reviewTasks: FT.ReviewTask[];
};

export function sortSubmissions(
  submissions: FT.Submission[]
): SortedSubmissions {
  const base: SortedSubmissions = {
    edits: [],
    reviewTasks: [],
  };
  return submissions.reduce((acc, s): SortedSubmissions => {
    return {
      ...acc,
      ...(s.type === "edit suggestion" ||
      s.type === "issue" ||
      s.type === "entry suggestion"
        ? {
            reviewTasks: [...acc.reviewTasks, s],
          }
        : {
            edits: [...acc.edits, s],
          }),
    };
  }, base);
}

type SortedEdits = {
  entryEdits: FT.EntryEdit[];
  newEntries: FT.NewEntry[];
  entryDeletions: FT.EntryDeletion[];
};

export function sortEdits(edits: FT.Edit[]): SortedEdits {
  const base: SortedEdits = {
    entryEdits: [],
    newEntries: [],
    entryDeletions: [],
  };
  return edits.reduce(
    (acc, edit): SortedEdits => ({
      ...acc,
      ...(edit.type === "entry edit"
        ? {
            entryEdits: [...acc.entryEdits, edit],
          }
        : edit.type === "new entry"
        ? {
            newEntries: [...acc.newEntries, edit],
          }
        : edit.type === "entry deletion"
        ? {
            entryDeletions: [...acc.entryDeletions, edit],
          }
        : {}),
    }),
    base
  );
}
