import { GoogleSpreadsheet } from "google-spreadsheet";
import * as functions from "firebase-functions";
import {
    Types as T,
    dictionaryEntryBooleanFields,
    dictionaryEntryNumberFields,
    dictionaryEntryTextFields,
    standardizePashto,
    validateEntry,
    writeDictionary,
    writeDictionaryInfo,
    simplifyPhonetics,
} from "@lingdocs/pashto-inflector";
// import {
//     getWordList,
// } from "./word-list-maker";
import {
    PublishDictionaryResponse,
} from "../../website/src/lib/functions-types";
import { Storage } from "@google-cloud/storage";
const storage = new Storage({
    projectId: "lingdocs",
});

const title = "LingDocs Pashto Dictionary"
const license = "Copyright © 2021 lingdocs.com All Rights Reserved - Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License - https://creativecommons.org/licenses/by-nc-sa/4.0/";
const bucketName = "lingdocs";
const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
const dictionaryFilename = "dictionary";
const dictionaryInfoFilename = "dictionary-info";
// const hunspellAffFileFilename = "ps_AFF.aff";
// const hunspellDicFileFilename = "ps_AFF.dic";
const url = `${baseUrl}${dictionaryFilename}`;
const infoUrl = `${baseUrl}${dictionaryInfoFilename}`;

function standardizePhonetics(f: string): string {
    return f.replace(/’/g, "'");
}

// TODO: Create a seperate function for publishing the Hunspell that can run after the publish function?
// to keep the publish function time down

export default async function(): Promise<PublishDictionaryResponse> {
    const entries = await getRawEntries();
    const errors = checkForErrors(entries);
    if (errors.length) {
        return({ ok: false, errors });
    }
    const duplicate = findDuplicateTs(entries);
    if (duplicate) {
        return({
            ok: false,
            errors: [{
                errors: [`${duplicate.ts} is a duplicate ts`],
                ts: duplicate.ts,
                p: duplicate.p,
                f: duplicate.f,
                e: duplicate.e,
                erroneousFields: ["ts"],
            }],
        });
    }
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
    }
    await uploadDictionaryToStorage(dictionary);
    // TODO: make this async and run after publish response
    // doHunspell(entries).catch(console.error);
    return {
        ok: true,
        info: dictionary.info
    };

}

// async function doHunspell(entries: T.DictionaryEntry[]) {
//     const wordlistResponse = getWordList(entries);
//     if (!wordlistResponse.ok) {
//         throw new Error(JSON.stringify(wordlistResponse.errors));
//     }
//     const hunspell = makeHunspell(wordlistResponse.wordlist);
//     await uploadHunspellToStorage(hunspell);
// }

async function getRawEntries(): Promise<T.DictionaryEntry[]> {
    const doc = new GoogleSpreadsheet(
        functions.config().sheet.id,
    );
    await doc.useServiceAccountAuth({
        client_email: functions.config().serviceacct.email,
        private_key: functions.config().serviceacct.key,
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const entries = makeEntries(rows);
    return entries;
}

function makeEntries(rows: any[]): T.DictionaryEntry[] {
    const entries: T.DictionaryEntry[] = rows.map((row, i): T.DictionaryEntry => {
        const e: T.DictionaryEntry = {
            i: 1,
            ts: parseInt(row.ts),
            p: row.p,
            f: row.f,
            g: simplifyPhonetics(row.f), 
            e: row.e,
        };
        dictionaryEntryNumberFields.forEach((field: T.DictionaryEntryNumberField) => {
            if (row[field]) {
                e[field] = parseInt(row[field]);
            }
        });
        dictionaryEntryTextFields.forEach((field: T.DictionaryEntryTextField) => {
            if (row[field]) {
                const content = field.slice(-1) === "p" ? standardizePashto(row[field]).trim()
                    : field.slice(-1) === "f" ? standardizePhonetics(row[field]).trim()
                    : row[field].trim();
                e[field] = content;
            }
        });
        dictionaryEntryBooleanFields.forEach((field: T.DictionaryEntryBooleanField) => {
            if (row[field]) {
                e[field] = true;
            }
        });
        return e;
    });
    // add alphabetical index
    entries.sort((a, b) => a.p.localeCompare(b.p, "ps"));
    const entriesLength = entries.length;
    for (let i = 0; i < entriesLength; i++) {
        entries[i].i = i;
    }
    return entries;
}

function checkForErrors(entries: T.DictionaryEntry[]): T.DictionaryEntryError[] {
    return entries.reduce((errors: T.DictionaryEntryError[], entry: T.DictionaryEntry) => {
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
            if (!complement.c?.includes("n.") && !complement.c?.includes("adj.") && !complement.c?.includes("adv.")) {
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
    }, []);
}

function findDuplicateTs(entries: T.DictionaryEntry[]): T.DictionaryEntry | undefined {
    const tsSoFar = new Set();
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < entries.length; i++) {
        const ts = entries[i].ts;
        if (tsSoFar.has(ts)) {
            return entries[i];
        }
        tsSoFar.add(ts);
    }
    return undefined;
}

async function upload(content: Buffer | string, filename: string) {
    const isBuffer = typeof content !== "string";
    const file = storage.bucket(bucketName).file(filename);
    await file.save(content, {
        gzip: isBuffer ? false : true,
        predefinedAcl: "publicRead",
        metadata: {
            contentType: isBuffer
                ? "application/octet-stream"
                : filename.slice(-5) === ".json"
                ? "application/json"
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

async function uploadDictionaryToStorage(dictionary: T.Dictionary) {
    const dictionaryBuffer = writeDictionary(dictionary);
    const dictionaryInfoBuffer = writeDictionaryInfo(dictionary.info);
    await Promise.all([
        upload(JSON.stringify(dictionary), `${dictionaryFilename}.json`),
        upload(JSON.stringify(dictionary.info), `${dictionaryInfoFilename}.json`),
        upload(dictionaryBuffer as Buffer, dictionaryFilename),
        upload(dictionaryInfoBuffer as Buffer, dictionaryInfoFilename),
    ]);
}

// function makeHunspell(wordlist: string[]) {
//     return {
//         dicContent: wordlist.reduce((acc, word) => acc + word + "\n", wordlist.length + "\n"),
//         affContent: "SET UTF-8\nCOMPLEXPREFIXES\nIGNORE ۱۲۳۴۵۶۷۸۹۰-=ًٌٍَُِّْ؛:؟.،,،؟\n",
//     };
// }
