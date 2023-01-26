import Nano from "nano";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
    dictionaryEntryTextFields,
    dictionaryEntryBooleanFields,
    dictionaryEntryNumberFields,
    standardizeEntry,
} from "@lingdocs/inflect";
import * as FT from "../../website/src/types/functions-types";
import * as functions from "firebase-functions";

const fieldsForEdit = [
    ...dictionaryEntryTextFields,
    ...dictionaryEntryNumberFields,
    ...dictionaryEntryBooleanFields,
].filter(field => !(["ts", "i"].includes(field)));


const nano = Nano(functions.config().couchdb.couchdb_url);
const reviewTasksDb = nano.db.use("review-tasks");

export async function receiveSubmissions(e: FT.SubmissionsRequest, editor: boolean): Promise<FT.SubmissionsResponse> {
    const { edits, reviewTasks } = sortSubmissions(e);

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

    if (editor && edits.length)  {

        const doc = new GoogleSpreadsheet(
            functions.config().sheet.id,
        );
        await doc.useServiceAccountAuth({
            client_email: functions.config().serviceacct.email,
            private_key: functions.config().serviceacct.key,
        });
        await doc.loadInfo();
        const dictionarySheet = doc.sheetsByIndex[0];

        const {
            newEntries,
            entryEdits,
            entryDeletions,
        } = sortEdits(edits);

        if (entryEdits.length || entryDeletions.length) {
            const dictRows = await dictionarySheet.getRows();
            entryEdits.forEach(async ({entry}) => {
                const i = dictRows.findIndex((r: any) => parseInt(r.ts) === entry.ts);
                if (i === -1) {
                    console.error("Tried editing an entry with a ts that doesn't exist");
                } else {
                    fieldsForEdit.forEach((field) => {
                        const toWrite = entry[field];
                        const existing = dictRows[i][field];
                        if (toWrite) {
                            // something to write
                            dictRows[i][field] = toWrite;
                        } else if (existing && !toWrite) {
                            // something to erase
                            dictRows[i][field] = "";
                        }
                    });
                }
                try {
                    await dictRows[i].save();
                } catch (error) {
                    console.error("error saving edit to entry " + entry.ts);
                    console.error(error);
                }
            });
            entryDeletions.forEach(async ({ ts }) => {
                const i = dictRows.findIndex((r: any) => parseInt(r.ts) === ts);
                if (i === -1) {
                    console.error("Tried deleting an entry with ats that doesn't exist")
                }
                try {
                    await dictRows[i].delete();
                } catch (error) {
                    console.error("error deleting error " + ts);
                    console.error(error);
                }
            });
        }
    
        if (newEntries.length) {
            newEntries.forEach((n) => {
                const entry = { ...standardizeEntry(n.entry) };
                // @ts-ignore
                delete entry.i; // i not used in dictionary spreadsheet; added while building it
                // @ts-ignore
                dictionarySheet.addRow(entry).catch(console.error);
            });
        }
    }

    return {
        ok: true,
        message: `received ${reviewTasks.length} review task(s), and ${edits.length} edit(s)`,
        submissions: e,
    };
}

type SortedSubmissions = {
    edits: FT.Edit[],
    reviewTasks: FT.ReviewTask[], 
};

export function sortSubmissions(submissions: FT.Submission[]): SortedSubmissions {
    const base: SortedSubmissions = {
        edits: [],
        reviewTasks: [],
    };
    return submissions.reduce((acc, s): SortedSubmissions => {
        return {
            ...acc,
            ...(s.type === "edit suggestion" || s.type === "issue" || s.type === "entry suggestion") ? {
                reviewTasks: [...acc.reviewTasks, s],
            } : {
                edits: [...acc.edits, s],
            },
        };
    }, base);
}

type SortedEdits = {
    entryEdits: FT.EntryEdit[],
    newEntries: FT.NewEntry[],
    entryDeletions: FT.EntryDeletion[],
}

export function sortEdits(edits: FT.Edit[]): SortedEdits {
    const base: SortedEdits = {
        entryEdits: [],
        newEntries: [],
        entryDeletions: [],
    }
    return edits.reduce((acc, edit): SortedEdits => ({
        ...acc,
        ...edit.type === "entry edit" ? {
            entryEdits: [...acc.entryEdits, edit],
        } : edit.type === "new entry" ? {
            newEntries: [...acc.newEntries, edit],
        } : edit.type === "entry deletion" ? {
            entryDeletions: [...acc.entryDeletions, edit],
        } : {},
    }), base);
}
