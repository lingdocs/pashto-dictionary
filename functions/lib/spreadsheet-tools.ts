import { Types as T } from "@lingdocs/inflect";
import * as FT from "../../website/src/types/functions-types";
import { standardizeEntry } from "@lingdocs/inflect";
import type { sheets_v4 } from "@googleapis/sheets";
import {
  dictionaryEntryBooleanFields,
  dictionaryEntryNumberFields,
  dictionaryEntryTextFields,
  simplifyPhonetics,
  standardizePashto,
} from "@lingdocs/inflect";

const validFields = [
  ...dictionaryEntryTextFields,
  ...dictionaryEntryBooleanFields,
  ...dictionaryEntryNumberFields,
];

export type Sheets = {
  spreadsheetId: string;
  spreadsheets: sheets_v4.Resource$Spreadsheets;
};

async function getTsIndex(sheets: Sheets): Promise<number[]> {
  const values = await getRange(sheets, "A2:A");
  return values.map((r) => parseInt(r[0]));
}

async function getFirstEmptyRow(sheets: Sheets): Promise<number> {
  const values = await getRange(sheets, "A2:A");
  return values.length + 2;
}

export async function getEntriesFromSheet({
  spreadsheets,
  spreadsheetId,
}: Sheets): Promise<T.DictionaryEntry[]> {
  const keyInfo = await getKeyInfo({ spreadsheets, spreadsheetId });
  const { data } = await spreadsheets.values.get({
    spreadsheetId,
    range: `A2:${keyInfo.lastCol}`,
  });
  if (!data.values) {
    throw new Error("data not found");
  }
  function processRow(row: string[]) {
    // TODO: optimize this
    const processedRow = row.flatMap<
      [keyof T.DictionaryEntry, string | boolean | number]
    >((x, i) => {
      if (x === "") {
        return [];
      }
      const k = keyInfo.keyRow[i];
      // @ts-expect-error
      if (dictionaryEntryNumberFields.includes(k)) {
        return [[k, parseInt(x)]];
      }
      // @ts-expect-error
      if (dictionaryEntryBooleanFields.includes(k)) {
        return [[k, x.toLowerCase() === "true"]];
      }
      return [[k, k.endsWith("p") ? standardizePashto(x.trim()) : x.trim()]];
    });
    return processedRow;
  }
  const entries = data.values.map(processRow).map((pr) => {
    return Object.fromEntries(pr) as T.DictionaryEntry;
  });
  entries.sort((a, b) => a.p.localeCompare(b.p, "ps"));
  const entriesLength = entries.length;
  // add index and g
  for (let i = 0; i < entriesLength; i++) {
    entries[i].i = i;
    entries[i].g = simplifyPhonetics(entries[i].f);
  }
  return entries;
}

export async function updateDictionaryEntries(
  { spreadsheets, spreadsheetId }: Sheets,
  edits: FT.EntryEdit[]
) {
  if (edits.length === 0) {
    return;
  }
  const entries = edits.map((e) => e.entry);
  const tsIndex = await getTsIndex({ spreadsheets, spreadsheetId });
  const { keyRow, lastCol } = await getKeyInfo({ spreadsheets, spreadsheetId });
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

export async function addDictionaryEntries(
  { spreadsheets, spreadsheetId }: Sheets,
  additions: FT.NewEntry[]
) {
  if (additions.length === 0) {
    return;
  }
  const entries = additions.map((x) => standardizeEntry(x.entry));
  const endRow = await getFirstEmptyRow({ spreadsheets, spreadsheetId });
  const { keyRow, lastCol } = await getKeyInfo({ spreadsheets, spreadsheetId });
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
  { spreadsheets, spreadsheetId }: Sheets,
  edits: { ts: number; col: keyof T.DictionaryEntry; val: any }[]
) {
  const tsIndex = await getTsIndex({ spreadsheets, spreadsheetId });
  const { colMap } = await getKeyInfo({ spreadsheets, spreadsheetId });
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

export async function deleteEntry(
  { spreadsheets, spreadsheetId }: Sheets,
  sheetId: number,
  ed: FT.EntryDeletion
) {
  const tsIndex = await getTsIndex({ spreadsheets, spreadsheetId });
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

async function getKeyInfo(sheets: Sheets): Promise<{
  colMap: Record<keyof T.DictionaryEntry, string>;
  colMapN: Record<keyof T.DictionaryEntry, number>;
  keyRow: (keyof T.DictionaryEntry)[];
  lastCol: string;
}> {
  const headVals = await getRange(sheets, "A1:1");
  const headRow: string[] = headVals[0];
  const colMap: Record<any, string> = {};
  const colMapN: Record<any, number> = {};
  headRow.forEach((c, i) => {
    if (validFields.every((v) => c !== v)) {
      throw new Error(`Invalid spreadsheet field ${c}`);
    }
    colMap[c] = getColumnLetters(i);
    colMapN[c] = i;
  });
  return {
    colMap: colMap as Record<keyof T.DictionaryEntry, string>,
    colMapN: colMapN as Record<keyof T.DictionaryEntry, number>,
    keyRow: headRow as (keyof T.DictionaryEntry)[],
    lastCol: getColumnLetters(headRow.length - 1),
  };
}

async function getRange(
  { spreadsheets, spreadsheetId }: Sheets,
  range: string
): Promise<any[][]> {
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
