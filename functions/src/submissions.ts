import Nano from "nano";
import * as FT from "../../website/src/types/functions-types";
import * as functions from "firebase-functions";
// import {
//   addDictionaryEntries,
//   deleteEntry,
//   updateDictionaryEntries,
// } from "./tools/spreadsheet-tools";

const nano = Nano(functions.config().couchdb.couchdb_url);
const reviewTasksDb = nano.db.use("review-tasks");

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
    // const { newEntries, entryEdits, entryDeletions } = sortEdits(edits);
    // await updateDictionaryEntries(entryEdits);
    // for (const ed of entryDeletions) {
    //   await deleteEntry(ed);
    // }
    // await addDictionaryEntries(newEntries);
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
