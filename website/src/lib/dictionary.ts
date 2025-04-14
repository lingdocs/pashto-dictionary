/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DictionaryDb } from "./dictionary-core";
import sanitizePashto from "./sanitize-pashto";
import fillerWords from "./filler-words";
import {
  Types as T,
  simplifyPhonetics,
  typePredicates as tp,
  revertSpelling,
} from "@lingdocs/ps-react";
// TODO: or use and modify leven ??
// @ts-ignore
import { levenshtein } from "edit-distance";
import { isPashtoScript } from "./is-pashto";
import { fuzzifyPashto } from "./fuzzify-pashto/fuzzify-pashto";
import { makeAWeeBitFuzzy } from "./wee-bit-fuzzy";
import { getTextOptions } from "./get-text-options";
import { DictionaryAPI, State } from "../types/dictionary-types";
import { isVerbDictionaryEntry } from "@lingdocs/ps-react/dist/lib/src/type-predicates";

const dictionaryBaseUrl = `https://storage.lingdocs.com/dictionary`;
const dictionaryUrl = `${dictionaryBaseUrl}/dictionary`;
const dictionaryInfoUrl = `${dictionaryBaseUrl}/dictionary-info`;

const dictionaryInfoLocalStorageKey = "dictionary-dict";
const dictionaryCollectionName = "dictionary-dict";
// const dictionaryDatabaseName = "dictdb.db";
export const pageSize = 60;

const db = indexedDB.open("inPrivate");
db.onerror = (e) => {
  console.error(e);
  alert(
    "Your browser does not have IndexedDB enabled. This might be because you are using private mode. Please use regular mode or enable IndexedDB to use this dictionary"
  );
};

const dictDb = new DictionaryDb({
  url: dictionaryUrl,
  infoUrl: dictionaryInfoUrl,
  collectionName: dictionaryCollectionName,
  infoLocalStorageKey: dictionaryInfoLocalStorageKey,
});

function makeSearchStringSafe(searchString: string): string {
  return searchString.replace(/[#-.]|[[-^]|[?|{}]/g, "");
}

function fuzzifyEnglish(input: string): string {
  const safeInput = input.trim().replace(/[#-.]|[[-^]|[?|{}]/g, "");
  // TODO: Could do: cover british/american things like offense / offence
  return safeInput
    .replace("to ", "")
    .replace(/our/g, "ou?r")
    .replace(/or/g, "ou?r")
    .replace(/i(s|z)e/g, "i(s|z)e");
}

function chunkOutArray<T>(arr: T[], chunkSize: number): T[][] {
  const R: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    R.push(arr.slice(i, i + chunkSize));
  }
  return R;
}

function getExpForInflections(input: string, index: "p" | "f"): RegExp {
  let base = input;
  if (index === "f") {
    if (["e", "é", "a", "á", "ó", "o"].includes(input.slice(-1))) {
      base = input.slice(0, -1);
    }
    return new RegExp(`\\b${base}`);
  }
  if (["ه", "ې", "و"].includes(input.slice(-1))) {
    base = input.slice(0, -1);
  }
  return new RegExp(`^${base}[و|ې|ه]?`);
}

function tsBack(period: "month" | "week"): number {
  if (period === "month") {
    // https://stackoverflow.com/a/24049314/8620945
    const d = new Date();
    const m = d.getMonth();
    d.setMonth(d.getMonth() - 1);

    // If still in same month, set date to last day of
    // previous month
    if (d.getMonth() === m) d.setDate(0);
    d.setHours(0, 0, 0);
    d.setMilliseconds(0);

    // Get the time value in milliseconds and convert to seconds
    return d.getTime();
  }
  const currentDate = new Date();
  const lastWeekDate = new Date(
    currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
  );
  return lastWeekDate.getTime();
}

function alphabeticalLookup({
  searchString,
  page,
}: {
  searchString: string;
  page: number;
}): T.DictionaryEntry[] {
  if (!dictDb.collection) {
    return [];
  }
  const r = new RegExp(
    "^" + sanitizePashto(makeSearchStringSafe(searchString))
  );
  const regexResults: T.DictionaryEntry[] = dictDb.collection.find({
    $or: [{ p: { $regex: r } }, { g: { $regex: r } }],
  });
  const indexNumbers = regexResults.map((mpd: any) => mpd.i);
  // Find the first matching word occuring first in the Pashto Index
  let firstIndexNumber = null;
  if (indexNumbers.length) {
    firstIndexNumber = Math.min(...indexNumbers);
  }
  // $gt query from that first occurance
  if (firstIndexNumber !== null) {
    return dictDb.collection
      .chain()
      .find({ i: { $gt: firstIndexNumber - 1 } })
      .simplesort("i")
      .limit(page * pageSize)
      .data();
  }
  return [];
}

function fuzzyLookup<S extends T.DictionaryEntry>({
  searchString,
  language,
  page,
  tpFilter,
}: {
  searchString: string;
  language: "Pashto" | "English" | "Both";
  page: number;
  tpFilter?: (e: T.DictionaryEntry) => e is S;
}): S[] {
  // TODO: Implement working with both
  if (Number(searchString)) {
    const entry = dictionary.findOneByTs(Number(searchString));
    // @ts-ignore;
    return entry ? [entry] : ([] as S[]);
  }
  return language === "Pashto"
    ? pashtoFuzzyLookup({ searchString, page, tpFilter })
    : englishLookup({ searchString, page, tpFilter });
}

function englishLookup<S extends T.DictionaryEntry>({
  searchString,
  page,
  tpFilter,
}: {
  searchString: string;
  page: number;
  tpFilter?: (e: T.DictionaryEntry) => e is S;
}): S[] {
  if (!dictDb.collection) {
    return [];
  }
  function sortByR(a: T.DictionaryEntry, b: T.DictionaryEntry) {
    return (b.r || 3) - (a.r || 3);
  }
  let resultsGiven: number[] = [];
  // get exact results
  const exactQuery = {
    e: {
      $regex: new RegExp(`^${fuzzifyEnglish(searchString)}$`, "i"),
    },
  };
  const exactResultsLimit = pageSize < 10 ? Math.floor(pageSize / 2) : 10;
  const exactResults = dictDb.collection
    .chain()
    .find(exactQuery)
    .limit(exactResultsLimit)
    .simplesort("i")
    .data();
  exactResults.sort(sortByR);
  resultsGiven = exactResults.map((mpd: any) => mpd.$loki);
  // get results with full word match at beginning of string
  const startingQuery = {
    e: {
      $regex: new RegExp(`^${fuzzifyEnglish(searchString)}\\b`, "i"),
    },
    $loki: { $nin: resultsGiven },
  };
  const startingResultsLimit = pageSize * page - resultsGiven.length;
  const startingResults = dictDb.collection
    .chain()
    .find(startingQuery)
    .limit(startingResultsLimit)
    .simplesort("i")
    .data();
  startingResults.sort(sortByR);
  resultsGiven = [
    ...resultsGiven,
    ...startingResults.map((mpd: any) => mpd.$loki),
  ];
  // get results with full word match anywhere
  const fullWordQuery = {
    e: {
      $regex: new RegExp(`\\b${fuzzifyEnglish(searchString)}\\b`, "i"),
    },
    $loki: { $nin: resultsGiven },
  };
  const fullWordResultsLimit = pageSize * page - resultsGiven.length;
  const fullWordResults = dictDb.collection
    .chain()
    .find(fullWordQuery)
    .limit(fullWordResultsLimit)
    .simplesort("i")
    .data();
  fullWordResults.sort(sortByR);
  resultsGiven = [
    ...resultsGiven,
    ...fullWordResults.map((mpd: any) => mpd.$loki),
  ];
  // get results with partial match anywhere
  const partialMatchQuery = {
    e: {
      $regex: new RegExp(`${fuzzifyEnglish(searchString)}`, "i"),
    },
    $loki: { $nin: resultsGiven },
  };
  const partialMatchLimit = pageSize * page - resultsGiven.length;
  const partialMatchResults = dictDb.collection
    .chain()
    .where(tpFilter ? tpFilter : () => true)
    .find(partialMatchQuery)
    .limit(partialMatchLimit)
    .simplesort("i")
    .data();
  partialMatchResults.sort(sortByR);
  const results = [
    ...exactResults,
    ...startingResults,
    ...fullWordResults,
    ...partialMatchResults,
  ];
  if (tpFilter) {
    return results.filter(tpFilter);
  }
  return results;
}

function pashtoExactLookup(searchString: string): T.DictionaryEntry[] {
  if (!dictDb.collection) {
    return [];
  }
  const index = isPashtoScript(searchString) ? "p" : "g";
  const search = index === "g" ? simplifyPhonetics(searchString) : searchString;
  return dictDb.collection.find({
    [index]: search,
  });
}

function pashtoFuzzyLookup<S extends T.DictionaryEntry>({
  searchString,
  page,
  tpFilter,
}: {
  searchString: string;
  page: number;
  tpFilter?: (e: T.DictionaryEntry) => e is S;
}): S[] {
  if (!dictDb.collection) {
    return [];
  }
  let resultsGiven: number[] = [];
  // Check if it's in Pashto or Latin script
  const searchStringToUse = sanitizePashto(makeSearchStringSafe(searchString));
  const index = isPashtoScript(searchStringToUse) ? "p" : "g";
  const search =
    index === "g" ? simplifyPhonetics(searchStringToUse) : searchStringToUse;
  const infIndex = index === "p" ? "p" : "f";
  // Get exact matches
  const exactExpression = new RegExp("^" + search);
  const weeBitFuzzy = new RegExp("^" + makeAWeeBitFuzzy(search, infIndex));
  // prepare exact expression for special matching
  // TODO: This is all a bit messy and could be done without regex
  const expressionForInflections = getExpForInflections(search, infIndex);
  const arabicPluralIndex = `ap${infIndex}`;
  const pashtoPluralIndex = `pp${infIndex}`;
  const presentStemIndex = `ps${infIndex}`;
  const firstInfIndex = `infa${infIndex}`;
  const secondInfIndex = `infb${infIndex}`;
  const pashtoExactResultFields = [
    {
      [index]: { $regex: exactExpression },
    },
    {
      [arabicPluralIndex]: { $regex: weeBitFuzzy },
    },
    {
      [pashtoPluralIndex]: { $regex: weeBitFuzzy },
    },
    {
      [presentStemIndex]: { $regex: weeBitFuzzy },
    },
    {
      [firstInfIndex]: { $regex: expressionForInflections },
    },
    {
      [secondInfIndex]: { $regex: expressionForInflections },
    },
  ];
  const exactQuery = { $or: [...pashtoExactResultFields] };
  // just special incase using really small limits
  // multiple times scrolling / chunking / sorting might get a bit messed up if using a limit of less than 10
  const exactResultsLimit = pageSize < 10 ? Math.floor(pageSize / 2) : 10;
  const exactResults = dictDb.collection
    .chain()
    .find(exactQuery)
    .limit(exactResultsLimit)
    .simplesort("i")
    .data();
  resultsGiven = exactResults.map((mpd: any) => mpd.$loki);
  // Get slightly fuzzy matches
  const slightlyFuzzy = new RegExp(makeAWeeBitFuzzy(search, infIndex), "i");
  const slightlyFuzzyQuery = {
    [index]: { $regex: slightlyFuzzy },
    $loki: { $nin: resultsGiven },
  };
  const slightlyFuzzyResultsLimit = pageSize * page - resultsGiven.length;
  const slightlyFuzzyResults = dictDb.collection
    .chain()
    .find(slightlyFuzzyQuery)
    .limit(slightlyFuzzyResultsLimit)
    .data();
  resultsGiven.push(...slightlyFuzzyResults.map((mpd: any) => mpd.$loki));
  // Get fuzzy matches
  const pashtoRegExLogic = fuzzifyPashto(search, {
    script: index === "p" ? "Pashto" : "Latin",
    simplifiedLatin: index === "g",
    allowSpacesInWords: true,
    matchStart: "word",
  });
  const fuzzyPashtoExperssion = new RegExp(pashtoRegExLogic);
  const pashtoFuzzyQuery = [
    {
      [index]: { $regex: fuzzyPashtoExperssion },
    },
    {
      // TODO: Issue, this fuzzy doesn't line up well because it's not the simplified phonetics - still has 's etc
      [arabicPluralIndex]: { $regex: fuzzyPashtoExperssion },
    },
    {
      [presentStemIndex]: { $regex: fuzzyPashtoExperssion },
    },
  ];
  // fuzzy results should be allowed to take up the rest of the limit (not used up by exact results)
  const fuzzyResultsLimit = pageSize * page - resultsGiven.length;
  // don't get these fuzzy results if searching in only English
  const fuzzyQuery = {
    $or: pashtoFuzzyQuery,
    $loki: { $nin: resultsGiven },
  };
  const fuzzyResults = dictDb.collection
    .chain()
    .find(fuzzyQuery)
    .limit(fuzzyResultsLimit)
    .data();
  const results = tpFilter
    ? [...exactResults, ...slightlyFuzzyResults, ...fuzzyResults].filter(
        tpFilter
      )
    : [...exactResults, ...slightlyFuzzyResults, ...fuzzyResults];
  // sort out each chunk (based on limit used multiple times by infinite scroll)
  // so that when infinite scrolling, it doesn't re-sort the previous chunks given
  // const closeResultsLength = exactResults.length + slightlyFuzzyResults.length;
  const chunksToSort = chunkOutArray(results, pageSize);
  return chunksToSort.flatMap((c) => sortByRelevancy(c, search, index));
}

function sortByRelevancy<T extends Record<"p" | "g", string>>(
  arr: Readonly<T[]>,
  searchI: string,
  index: "p" | "g"
): T[] {
  // TODO: experiment with larger page sizes and not exact query,
  // especially with phonetic searches like ghuT
  //
  // TODO: if result came from special query, mark it as special and
  // then don't mess with the relevancy
  // now instead of an extra pass for exact, we can just use this!
  const similars = {
    p: ["دډتټ", "زذضظځ", "صسث", "رړڼ", "ڼن", "یيېۍ", "قک", "ګږ", "ښخحه", "پف"],
    g: ["tdTD", "rRN", "nN", "ei", "xkg", "pf", "au"],
  };
  function insert() {
    return 1;
  }
  // check if it's removing dz etc
  function remove() {
    return 1;
  }
  function update(a: string, b: string) {
    return similars[index].find((x) => x.includes(a) && x.includes(b))
      ? 0.5
      : a !== b
      ? 1
      : 0;
  }
  function levenOverVars(g: string, s: string): number {
    if (!g.includes(",")) {
      return levenshtein(g, s, insert, remove, update).distance;
    }
    return Math.min(
      ...g
        .split(",")
        .map((x) => levenshtein(x, s, insert, remove, update).distance)
    );
  }

  const toSort = [...arr];
  if (index === "g") {
    toSort.sort((a, b) => {
      const aDist = levenOverVars(a[index], searchI);
      const bDist = levenOverVars(b[index], searchI);
      return aDist - bDist;
    });
  } else {
    toSort.sort((a, b) => {
      const aDist = levenshtein(
        a[index],
        searchI,
        insert,
        remove,
        update
      ).distance;
      const bDist = levenshtein(
        b[index],
        searchI,
        insert,
        remove,
        update
      ).distance;
      return aDist - bDist;
    });
  }
  return toSort;
}

function relatedWordsLookup(word: T.DictionaryEntry): T.DictionaryEntry[] {
  if (!dictDb.collection) {
    return [];
  }
  const wordArray = word.e
    .trim()
    .replace(/\?/g, "")
    .replace(/( |,|\.|!|;|\(|\))/g, " ")
    .split(/ +/)
    .filter((w: string) => !fillerWords.includes(w));
  let results: T.DictionaryEntry[] = [];
  wordArray.forEach((w: string) => {
    if (!dictDb.collection) {
      return [];
    }
    let r: RegExp;
    try {
      r = new RegExp(`\\b${w}\\b`, "i");
      const relatedToWord = dictDb.collection
        .chain()
        .find({
          // don't include the original word
          ts: { $ne: word.ts },
          e: { $regex: r },
        })
        .limit(5)
        .data();
      results = [...results, ...relatedToWord];
      // In case there's some weird regex fail
    } catch (error) {
      /* istanbul ignore next */
      console.error(error);
    }
  });
  // Remove duplicate items - https://stackoverflow.com/questions/40811451/remove-duplicates-from-a-array-of-objects
  results = results.filter(function (a) {
    // @ts-ignore
    return !this[a.$loki] && (this[a.$loki] = true);
  }, Object.create(null));
  return results;
}

export function allEntries() {
  if (!dictDb.collection) {
    return [];
  }
  return dictDb.collection.find();
}

function makeLookupPortal<X extends T.DictionaryEntry>(
  tpFilter: (x: T.DictionaryEntry) => x is X
): T.EntryLookupPortal<X> {
  return {
    search: (s: string) =>
      fuzzyLookup({
        searchString: s,
        language: "Pashto",
        page: 1,
        tpFilter,
      }),
    getByTs: (ts: number) => {
      const res = dictDb.findOneByTs(ts);
      if (!res) return undefined;
      return tpFilter(res) ? res : undefined;
    },
    getByL: () => {
      // TODO: maybe take this off of the type for the non-verb lookup portal
      return [];
    },
  };
}

function makeVerbLookupPortal(): T.EntryLookupPortal<T.VerbEntry> {
  return {
    search: (s: string) => {
      const vEntries = fuzzyLookup({
        searchString: s,
        language: "Pashto",
        page: 1,
        tpFilter: tp.isVerbDictionaryEntry,
      });
      return vEntries.map(
        (entry): T.VerbEntry => ({
          entry,
          complement:
            entry.c?.includes("comp.") && entry.l
              ? dictionary.findOneByTs(entry.l)
              : undefined,
        })
      );
    },
    getByTs: (ts: number): T.VerbEntry | undefined => {
      const entry = dictDb.findOneByTs(ts);
      if (!entry) return undefined;
      if (!tp.isVerbDictionaryEntry(entry)) {
        console.error("not valid verb entry");
        return undefined;
      }
      const complement = (() => {
        if (entry.c?.includes("comp") && entry.l) {
          const comp = dictDb.findOneByTs(entry.l);
          if (!comp) {
            console.error("complement not found for", entry);
          }
          return comp;
        } else {
          return undefined;
        }
      })();
      return { entry, complement };
    },
    getByL: (l: number): T.VerbEntry[] => {
      const vEntries = dictionary.findByL(l).filter(isVerbDictionaryEntry);
      return vEntries.map(
        (entry): T.VerbEntry => ({
          entry,
          complement:
            entry.c?.includes("comp.") && entry.l
              ? dictionary.findOneByTs(entry.l)
              : undefined,
        })
      );
    },
  };
}

export const entryFeeder: T.EntryFeeder = {
  nouns: makeLookupPortal(tp.isNounEntry),
  verbs: makeVerbLookupPortal(),
  adjectives: makeLookupPortal(tp.isAdjectiveEntry),
  locativeAdverbs: makeLookupPortal(tp.isLocativeAdverbEntry),
  adverbs: makeLookupPortal(tp.isAdverbEntry),
};

export const dictionary: DictionaryAPI = {
  // NOTE: For some reason that I do not understand you have to pass the functions from the
  // dictionary core class in like this... ie. initialize: dictDb.initialize will mess up the this usage
  // in the dictionary core class
  initialize: async () => await dictDb.initialize(),
  update: async (notifyUpdateComing: () => void) =>
    await dictDb.updateDictionary(notifyUpdateComing),
  search: function (state: State): T.DictionaryEntry[] {
    const searchString = revertSpelling(
      state.searchValue,
      getTextOptions(state).spelling
    );
    if (state.searchValue === "") {
      return [];
    }
    return state.options.searchType === "alphabetical" &&
      state.options.language === "Pashto"
      ? alphabeticalLookup({
          searchString,
          page: state.page,
        })
      : fuzzyLookup({
          searchString,
          language: state.options.language,
          page: state.page,
        });
  },
  exactPashtoSearch: pashtoExactLookup,
  getNewWords: function (period: "week" | "month"): T.DictionaryEntry[] {
    if (!dictDb.collection) {
      return [];
    }
    return dictDb.collection
      .chain()
      .find({
        ts: { $gt: tsBack(period) },
      })
      .simplesort("ts")
      .data()
      .reverse();
  },
  findOneByTs: (ts: number) => dictDb.findOneByTs(ts),
  findByL: (l: number) => dictDb.findByL(l),
  findRelatedEntries: function (entry: T.DictionaryEntry): T.DictionaryEntry[] {
    return relatedWordsLookup(entry);
  },
};
