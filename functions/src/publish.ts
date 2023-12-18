import { GoogleSpreadsheet } from "google-spreadsheet";
import * as functions from "firebase-functions";
import {
  Types as T,
  dictionaryEntryBooleanFields,
  dictionaryEntryNumberFields,
  dictionaryEntryTextFields,
  validateEntry,
  writeDictionary,
  writeDictionaryInfo,
  simplifyPhonetics,
  standardizeEntry,
} from "@lingdocs/inflect";
import { getWordList } from "./word-list-maker";
import { PublishDictionaryResponse } from "../../website/src/types/functions-types";
import { Storage } from "@google-cloud/storage";
const storage = new Storage({
  projectId: "lingdocs",
});

const title = "LingDocs Pashto Dictionary";
const license = `Copyright © ${new Date().getFullYear()} lingdocs.com All Rights Reserved - Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License - https://creativecommons.org/licenses/by-nc-sa/4.0/`;
const bucketName = "lingdocs";
const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
const dictionaryFilename = "dictionary";
const dictionaryInfoFilename = "dictionary-info";
// const hunspellAffFileFilename = "ps_AFF.aff";
// const hunspellDicFileFilename = "ps_AFF.dic";
const allWordsJsonFilename = "all-words-dictionary.json";
const url = `${baseUrl}${dictionaryFilename}`;
const infoUrl = `${baseUrl}${dictionaryInfoFilename}`;

// TODO: Create a seperate function for publishing the Hunspell that can run after the publish function?
// to keep the publish function time down

export default async function publish(): Promise<PublishDictionaryResponse> {
  const entries = await getRawEntries();
  const errors = checkForErrors(entries);
  if (errors.length) {
    return { ok: false, errors };
  }
  // const duplicates = findDuplicates(entries);
  // duplicates.forEach((duplicate) => {
  //     const index = entries.findIndex(e => e.ts === duplicate.ts);
  //     if (index > -1) entries.splice(index, 1);
  // })
  const dictionary: T.Dictionary = {
    info: {
      title,
      license,
      url,
      infoUrl,
      release: new Date().getTime(),
      numberOfEntries: entries.length,
    },
    entries,
  };
  uploadDictionaryToStorage(dictionary).catch(console.error);
  uploadSitemap(dictionary).catch(console.error);
  // TODO: make this async and run after publish response
  doHunspellEtc(dictionary.info, entries).catch(console.error);
  return {
    ok: true,
    info: dictionary.info,
  };
}

async function doHunspellEtc(
  info: T.DictionaryInfo,
  entries: T.DictionaryEntry[]
) {
  const wordlistResponse = getWordList(entries);
  if (!wordlistResponse.ok) {
    throw new Error(JSON.stringify(wordlistResponse.errors));
  }
  // const hunspell = makeHunspell(wordlistResponse.wordlist);
  // await uploadHunspellToStorage(hunspell);
  await uploadAllWordsToStoarage(info, wordlistResponse.wordlist);
}

/**
 * Gets the entries from the spreadsheet, and also deletes duplicate
 * entries that are sometimes annoyingly created by the GoogleSheets API
 * when adding entries programmatically
 *
 * @returns
 *
 */

async function getRows() {
  const doc = new GoogleSpreadsheet(functions.config().sheet.id);
  await doc.useServiceAccountAuth({
    client_email: functions.config().serviceacct.email,
    private_key: functions.config().serviceacct.key,
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  rows.sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0));
  return rows;
}

async function getRawEntries(): Promise<T.DictionaryEntry[]> {
  const rows = await getRows();
  async function deleteRow(i: number) {
    console.log("WILL DELETE ROW", rows[i].p, rows[i].ts, rows[i].f);
    await rows[i].delete();
  }
  const entries: T.DictionaryEntry[] = [];
  let sheetIndex = 0;
  // get the rows in order of ts for easy detection of duplicate entries
  for (let i = 0; i < rows.length; i++) {
    function sameEntry(a: any, b: any): boolean {
      return a.p === b.p && a.f === b.f && a.e === b.e;
    }
    sheetIndex++;
    const row = rows[i];
    const nextRow = rows[i + 1] || undefined;
    if (row.ts === nextRow?.ts) {
      if (sameEntry(row, nextRow)) {
        // this looks like a duplicate entry made by the sheets api
        // delete it and keep going
        await deleteRow(sheetIndex);
        sheetIndex--;
        continue;
      } else {
        throw new Error(`ts ${row.ts} is a duplicate ts of a different entry`);
      }
    }
    const e: T.DictionaryEntry = {
      i: 1,
      ts: parseInt(row.ts),
      p: row.p,
      f: row.f,
      g: simplifyPhonetics(row.f),
      e: row.e,
    };
    dictionaryEntryNumberFields.forEach(
      (field: T.DictionaryEntryNumberField) => {
        if (row[field]) e[field] = parseInt(row[field]);
      }
    );
    dictionaryEntryTextFields.forEach((field: T.DictionaryEntryTextField) => {
      if (row[field]) e[field] = row[field].trim();
    });
    dictionaryEntryBooleanFields.forEach(
      (field: T.DictionaryEntryBooleanField) => {
        if (row[field]) e[field] = true;
      }
    );
    entries.push(standardizeEntry(e));
  }
  // add alphabetical index
  entries.sort((a, b) => a.p.localeCompare(b.p, "ps"));
  const entriesLength = entries.length;
  // add index
  for (let i = 0; i < entriesLength; i++) {
    entries[i].i = i;
  }
  return entries;
}

function checkForErrors(
  entries: T.DictionaryEntry[]
): T.DictionaryEntryError[] {
  return entries.reduce(
    (errors: T.DictionaryEntryError[], entry: T.DictionaryEntry) => {
      const response = validateEntry(entry);
      if ("errors" in response && response.errors.length) {
        return [...errors, response];
      }
      if ("checkComplement" in response) {
        const complement = entries.find((e) => e.ts === entry.l);
        if (!complement) {
          const error: T.DictionaryEntryError = {
            errors: ["complement link not found in dictonary"],
            ts: entry.ts,
            p: entry.p,
            f: entry.f,
            e: entry.e,
            erroneousFields: ["l"],
          };
          return [...errors, error];
        }
        if (
          !complement.c?.includes("n.") &&
          !complement.c?.includes("adj.") &&
          !complement.c?.includes("adv.")
        ) {
          const error: T.DictionaryEntryError = {
            errors: ["complement link to invalid complement"],
            ts: entry.ts,
            p: entry.p,
            f: entry.f,
            e: entry.e,
            erroneousFields: ["l"],
          };
          return [...errors, error];
        }
      }
      return errors;
    },
    []
  );
}

// function findDuplicates(entries: T.DictionaryEntry[]): T.DictionaryEntry[] {
//     const tsSoFar = new Set();
//     const duplicates: T.DictionaryEntry[] = [];
//     // tslint:disable-next-line: prefer-for-of
//     for (let i = 0; i < entries.length; i++) {
//         const ts = entries[i].ts;
//         if (tsSoFar.has(ts)) {
//             duplicates.push(entries[i]);
//         }
//         tsSoFar.add(ts);
//     }
//     return duplicates;
// }

async function upload(content: Buffer | string, filename: string) {
  const isBuffer = typeof content !== "string";
  const file = storage.bucket(bucketName).file(filename);
  await file.save(content, {
    gzip: isBuffer ? false : true,
    predefinedAcl: "publicRead",
    metadata: {
      contentType: isBuffer
        ? "application/octet-stream"
        : filename.endsWith(".json")
        ? "application/json"
        : filename.endsWith(".xml")
        ? "application/xml"
        : "text/plain; charset=UTF-8",
      cacheControl: "no-cache",
    },
  });
}

// async function uploadHunspellToStorage(wordlist: {
//     affContent: string,
//     dicContent: string,
// }) {
//     await Promise.all([
//         upload(wordlist.affContent, hunspellAffFileFilename),
//         upload(wordlist.dicContent, hunspellDicFileFilename),
//     ]);
// }

async function uploadAllWordsToStoarage(
  info: T.DictionaryInfo,
  words: T.PsString[]
) {
  await upload(
    JSON.stringify({ info, words } as T.AllWordsWithInflections),
    allWordsJsonFilename
  );
}

async function uploadSitemap(dictionary: T.Dictionary) {
  await upload(makeSitemap(dictionary), "sitemap.xml");
}

async function uploadDictionaryToStorage(dictionary: T.Dictionary) {
  const dictionaryBuffer = writeDictionary(dictionary);
  const dictionaryInfoBuffer = writeDictionaryInfo(dictionary.info);
  await Promise.all([
    upload(JSON.stringify(dictionary), `${dictionaryFilename}.json`),
    upload(
      JSON.stringify(dictionary.info, null, "\t"),
      `${dictionaryInfoFilename}.json`
    ),
    upload(dictionaryBuffer as Buffer, dictionaryFilename),
    upload(dictionaryInfoBuffer as Buffer, dictionaryInfoFilename),
  ]);
}

function makeSitemap(dictionary: T.Dictionary): string {
  const pages = [
    ...["", "/about", "/settings", "/account", "/phrase-builder"],
    ...dictionary.entries.map((x) => `/word?id=${x.ts}`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) =>
        `
  <url>
    <loc>https://dictionary.lingdocs.com${page}</loc>
  </url>`
    )
    .join("")}
</urlset> 
`;
}

// function makeHunspell(wordlist: string[]) {
//     return {
//         dicContent: wordlist.reduce((acc, word) => acc + word + "\n", wordlist.length + "\n"),
//         affContent: "SET UTF-8\nCOMPLEXPREFIXES\nIGNORE ۱۲۳۴۵۶۷۸۹۰-=ًٌٍَُِّْ؛:؟.،,،؟\n",
//     };
// }
