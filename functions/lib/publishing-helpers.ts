import { Types as T, validateEntry } from "@lingdocs/inflect";

const title = "LingDocs Pashto Dictionary";
const license = `Copyright © ${new Date().getFullYear()} lingdocs.com All Rights Reserved - Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License - https://creativecommons.org/licenses/by-nc-sa/4.0/`;
const baseUrl = `https://storage.lingdocs.com/dictionary/`;
export const dictionaryFilename = "dictionary";
export const dictionaryInfoFilename = "dictionary-info";
// const hunspellAffFileFilename = "ps_AFF.aff";
// const hunspellDicFileFilename = "ps_AFF.dic";
// const allWordsJsonFilename = "all-words-dictionary.json";
const url = `${baseUrl}${dictionaryFilename}`;
const infoUrl = `${baseUrl}${dictionaryInfoFilename}`;

export function makeDictionaryObject(
  entries: T.DictionaryEntry[]
): T.Dictionary {
  return {
    info: {
      // @ts-ignore
      testVal: true,
      title,
      license,
      url,
      infoUrl,
      release: new Date().getTime(),
      numberOfEntries: entries.length,
    },
    entries,
  };
}

export function checkForErrors(
  entries: T.DictionaryEntry[]
): (T.DictionaryEntryError | { duplicates: number[] })[] {
  // check for duplicates
  const tsMap: Record<number, T.DictionaryEntry> = {};
  const duplicates: number[] = [];
  // making a map here based on ts with the entry will speed up the
  // compliment checking process!!
  for (var i = 0; i < entries.length; i++) {
    const ts = entries[i].ts;
    if (ts in tsMap) {
      duplicates.push(ts);
    } else {
      tsMap[ts] = entries[i];
    }
  }
  if (duplicates.length) {
    return [{ duplicates }];
  }
  // check for errors
  return entries.reduce(
    (errors: T.DictionaryEntryError[], entry: T.DictionaryEntry) => {
      const response = validateEntry(entry);
      if ("errors" in response && response.errors.length) {
        return [...errors, response];
      }
      if ("checkComplement" in response) {
        if (!entry.l) {
          const error: T.DictionaryEntryError = {
            errors: ["complement needed"],
            ts: entry.ts,
            p: entry.p,
            f: entry.f,
            e: entry.e,
            erroneousFields: ["l"],
          };
          return [...errors, error];
        }
        const complement = tsMap[entry.l];
        if (!complement) {
          const error: T.DictionaryEntryError = {
            errors: ["complement link not found in dictionary"],
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

export function makeSitemap(dictionary: T.Dictionary): string {
  function tsToDate(ts: number): string {
    if (ts < 10000000000) {
      // approximate date for old-style timestamps
      return "2021-01-01";
    }
    return getDateString(new Date(ts));
  }
  function getDateString(d: Date): string {
    return d.toISOString().split("T")[0];
  }
  const pages = [
    "",
    "about",
    "settings",
    "account",
    "phrase-builder",
    "new-entries",
  ];
  const currentDate = getDateString(new Date());
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) =>
        `
  <url>
    <loc>https://dictionary.lingdocs.com/${page}</loc>
    <lastmod>${currentDate}</lastmod>
  </url>`
    )
    .join("")}
    ${dictionary.entries
      .map(
        (entry) =>
          `
  <url>
    <loc>https://dictionary.lingdocs.com/word?id=${entry.ts}</loc>
    <lastmod>${tsToDate(entry.ts)}</lastmod>
  </url>`
      )
      .join("")}
</urlset> 
`;
}

// FOR HUNSPELL
// const hunspellAffFileFilename = "ps_AFF.aff";
// const hunspellDicFileFilename = "ps_AFF.dic";

// async function doHunspellEtc(
//   info: T.DictionaryInfo,
//   entries: T.DictionaryEntry[]
// ) {
//   const wordlistResponse = getWordList(entries);
//   if (!wordlistResponse.ok) {
//     throw new Error(JSON.stringify(wordlistResponse.errors));
//   }
//   // const hunspell = makeHunspell(wordlistResponse.wordlist);
//   // await uploadHunspellToStorage(hunspell);
//   await uploadAllWordsToStoarage(info, wordlistResponse.wordlist);
// }

// function makeHunspell(wordlist: string[]) {
//     return {
//         dicContent: wordlist.reduce((acc, word) => acc + word + "\n", wordlist.length + "\n"),
//         affContent: "SET UTF-8\nCOMPLEXPREFIXES\nIGNORE ۱۲۳۴۵۶۷۸۹۰-=ًٌٍَُِّْ؛:؟.،,،؟\n",
//     };
// }
