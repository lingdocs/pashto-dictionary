import { google } from "googleapis";
import { Types as T } from "@lingdocs/inflect";
import * as FT from "../../../website/src/types/functions-types";
import { standardizeEntry } from "@lingdocs/inflect";
import {
  dictionaryEntryBooleanFields,
  dictionaryEntryNumberFields,
  dictionaryEntryTextFields,
} from "@lingdocs/inflect";
import * as functions from "firebase-functions";

const spreadsheetId = functions.config().sheet.id;
const sheetId = 51288491;
const validFields = [
  ...dictionaryEntryTextFields,
  ...dictionaryEntryBooleanFields,
  ...dictionaryEntryNumberFields,
];

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const auth = new google.auth.GoogleAuth({
  credentials: {
    private_key: functions.config().serviceacct.key,
    client_email: functions.config().serviceacct.email,
  },
  scopes: SCOPES,
});

const { spreadsheets } = google.sheets({
  version: "v4",
  auth,
});

async function getTsIndex(): Promise<number[]> {
  const values = await getRange("A2:A");
  return values.map((r) => parseInt(r[0]));
}

async function getFirstEmptyRow(): Promise<number> {
  const values = await getRange("A2:A");
  return values.length + 2;
}

export async function updateDictionaryEntries(edits: FT.EntryEdit[]) {
  if (edits.length === 0) {
    return;
  }
  const entries = edits.map((e) => e.entry);
  const tsIndex = await getTsIndex();
  const { keyRow, lastCol } = await getKeyInfo();
  function entryToRowArray(e: T.DictionaryEntry): any[] {
    return keyRow.slice(1).map((k) => e[k] || "");
  }
  const data = entries.flatMap((entry) => {
    const rowNum = getRowNumFromTs(tsIndex, entry.ts);
    if (rowNum === undefined) {
      console.error(`couldn't find ${entry.ts} ${JSON.stringify(entry)}`);
      return [];
    }
    const values = [entryToRowArray(entry)];
    return [
      {
        range: `B${rowNum}:${lastCol}${rowNum}`,
        values,
      },
    ];
  });
  await spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      data,
      valueInputOption: "RAW",
    },
  });
}

export async function addDictionaryEntries(additions: FT.NewEntry[]) {
  if (additions.length === 0) {
    return;
  }
  const entries = additions.map((x) => standardizeEntry(x.entry));
  const endRow = await getFirstEmptyRow();
  const { keyRow, lastCol } = await getKeyInfo();
  const ts = Date.now();
  function entryToRowArray(e: T.DictionaryEntry): any[] {
    return keyRow.slice(1).map((k) => e[k] || "");
  }
  const values = entries.map((entry, i) => [ts + i, ...entryToRowArray(entry)]);
  await spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      data: [
        {
          range: `A${endRow}:${lastCol}${endRow + (values.length - 1)}`,
          values,
        },
      ],
      valueInputOption: "RAW",
    },
  });
}

export async function updateDictionaryFields(
  edits: { ts: number; col: keyof T.DictionaryEntry; val: any }[]
) {
  const tsIndex = await getTsIndex();
  const { colMap } = await getKeyInfo();
  const data = edits.flatMap((edit) => {
    const rowNum = getRowNumFromTs(tsIndex, edit.ts);
    if (rowNum === undefined) {
      console.error(`couldn't find ${edit.ts} ${JSON.stringify(edit)}`);
      return [];
    }
    const col = colMap[edit.col];
    return [
      {
        range: `${col}${rowNum}:${col}${rowNum}`,
        values: [[edit.val]],
      },
    ];
  });
  await spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      data,
      valueInputOption: "RAW",
    },
  });
}

export async function deleteEntry(ed: FT.EntryDeletion) {
  const tsIndex = await getTsIndex();
  const row = getRowNumFromTs(tsIndex, ed.ts);
  if (!row) {
    console.error(`${ed.ts} not found to do delete`);
    return;
  }
  const requests = [
    {
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: row - 1,
          endIndex: row,
        },
      },
    },
  ];
  await spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests,
      includeSpreadsheetInResponse: false,
      responseRanges: [],
    },
  });
}

function getRowNumFromTs(tsIndex: number[], ts: number): number | undefined {
  const res = tsIndex.findIndex((x) => x === ts);
  if (res === -1) {
    return undefined;
  }
  return res + 2;
}

async function getKeyInfo(): Promise<{
  colMap: Record<keyof T.DictionaryEntry, string>;
  keyRow: (keyof T.DictionaryEntry)[];
  lastCol: string;
}> {
  const headVals = await getRange("A1:1");
  const headRow: string[] = headVals[0];
  const colMap: any = {};
  headRow.forEach((c, i) => {
    if (validFields.every((v) => c !== v)) {
      throw new Error(`Invalid spreadsheet field ${c}`);
    }
    colMap[c] = getColumnLetters(i);
  });
  return {
    colMap: colMap as Record<keyof T.DictionaryEntry, string>,
    keyRow: headRow as (keyof T.DictionaryEntry)[],
    lastCol: getColumnLetters(headRow.length - 1),
  };
}

async function getRange(range: string): Promise<any[][]> {
  const { data } = await spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  if (!data.values) {
    throw new Error("data not found");
  }
  return data.values;
}

function getColumnLetters(num: number) {
  let letters = "";
  while (num >= 0) {
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26] + letters;
    num = Math.floor(num / 26) - 1;
  }
  return letters;
}
