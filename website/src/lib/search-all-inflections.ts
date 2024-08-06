import { searchPile } from "../lib/search-pile";
import {
  isNounAdjOrVerb,
  removeAccents,
  standardizePashto,
} from "@lingdocs/ps-react";
import { dictionary } from "../lib/dictionary";
import {
  conjugateVerb,
  inflectWord,
  Types as T,
  getVerbInfo,
} from "@lingdocs/ps-react";
import { isPashtoScript } from "./is-pashto";
import {
  InflectionSearchResult,
  InflectionFormMatch,
} from "../types/dictionary-types";
import { makeAWeeBitFuzzy } from "./wee-bit-fuzzy";
// @ts-ignore
import relevancy from "relevancy";

const relevancySorter = new relevancy.Sorter();

// 1st iteration: Brute force make every single conjugation and check all - 5300ms
// 2nd iteration: Check if it makes a big difference to search via function - 5100ms
// 3rd interation: First check for the first two letters in the verb info
//    if present, conjugation and search the whole conjugation 255ms !! 🎉💪
//    That's so much better I'm removing the option of skipping compounds
// ~4th iteration:~ ignore perfective or imperfective if wasn't present in verb info (not worth it - scrapped)

export function searchAllInflections(
  allDocs: T.DictionaryEntry[],
  searchValue: string
): {
  exact: InflectionSearchResult[];
  fuzzy: InflectionSearchResult[];
} {
  // pretty ugly function to seperate the exact and fuzzy inflection result matches
  function getEntryMatchIndex(
    r: InflectionSearchResult[],
    entry: T.DictionaryEntry
  ): number {
    return r.findIndex((rs) => rs.entry.ts === entry.ts);
  }
  function getFormIndex(r: InflectionSearchResult, path: string[]): number {
    const joinedPath = path.join("");
    return r.forms.findIndex((rs) => rs.path.join("") === joinedPath);
  }
  const v = standardizePashto(searchValue);
  const allResults = searchAllInflectionsCore(allDocs, searchValue);
  const results: {
    exact: InflectionSearchResult[];
    fuzzy: InflectionSearchResult[];
  } = {
    exact: [],
    fuzzy: [],
  };
  allResults.forEach((result) => {
    const entryMatches: {
      exact: InflectionSearchResult[];
      fuzzy: InflectionSearchResult[];
    } = {
      exact: [],
      fuzzy: [],
    };
    result.forms.forEach((form) => {
      form.matches.forEach((match) => {
        if (match.ps.p === v || match.ps.f === v) {
          addToEntryMatches("exact");
        } else {
          addToEntryMatches("fuzzy");
        }
        function addToEntryMatches(t: "exact" | "fuzzy") {
          let entryMatchIndex = getEntryMatchIndex(
            entryMatches[t],
            result.entry
          );
          if (entryMatchIndex === -1) {
            entryMatches[t].push({
              entry: result.entry,
              forms: [],
            });
            entryMatchIndex = entryMatches[t].length - 1;
          }
          let formIndex = getFormIndex(
            entryMatches[t][entryMatchIndex],
            form.path
          );
          if (formIndex === -1) {
            entryMatches[t][entryMatchIndex].forms.push({
              path: form.path,
              matches: [match],
            });
            formIndex = entryMatches[t][entryMatchIndex].forms.length - 1;
          } else {
            entryMatches[t][entryMatchIndex].forms[formIndex].matches.push(
              match
            );
          }
        }
      });
    });
    results.exact.push(...entryMatches.exact);
    results.fuzzy.push(...entryMatches.fuzzy);
  });
  return results;
}

export function searchAllInflectionsCore(
  allDocs: T.DictionaryEntry[],
  searchValue: string
): InflectionSearchResult[] {
  const index = isPashtoScript(searchValue) ? "p" : "f";
  function sortResultsByRelevancy(
    arr: InflectionSearchResult[]
  ): InflectionSearchResult[] {
    return relevancySorter.sort(
      arr,
      searchValue,
      (obj: InflectionSearchResult, calc: any) =>
        calc(removeAccents(obj.forms[0].matches[0].ps[index]))
    );
  }
  // TODO: could be better to remove the accents on the searchValue as well beforehand
  function sortMatchesByRelevancy(
    r: InflectionSearchResult
  ): InflectionSearchResult {
    // first sort all the matches of each form by relevance
    const rStage2 = {
      ...r,
      forms: r.forms.map((x) => ({
        ...x,
        matches: relevancySorter.sort(
          x.matches,
          searchValue,
          (
            obj: {
              ps: T.PsString;
            },
            calc: any
          ) => calc(removeAccents(obj.ps[index]))
        ),
      })),
    };
    // then sort the forms by relevance
    const forms = relevancySorter.sort(
      rStage2.forms,
      searchValue,
      (obj: InflectionFormMatch, calc: any) =>
        calc(removeAccents(obj.matches[0].ps[index]))
    );
    return {
      ...r,
      forms,
    };
  }

  // const timerLabel = "Search inflections";
  const script = isPashtoScript(searchValue) ? "p" : "f";
  const begRegex = new RegExp(
    makeAWeeBitFuzzy(searchValue.slice(0, 3), script, true),
    "i"
  );
  const preSearchFun = (ps: T.PsString) => !!ps[script].match(begRegex);
  const searchRegex = new RegExp(
    `${makeAWeeBitFuzzy(searchValue, script, true)}$`,
    "i"
  );
  // add little bit fuzzy
  // also do version without directional pronoun on front
  const searchFun = (ps: T.PsString) => !!ps[script].match(searchRegex);
  // console.time(timerLabel);
  const results = allDocs.reduce((all: InflectionSearchResult[], entry) => {
    const type = isNounAdjOrVerb(entry);
    if (entry.c && type === "verb") {
      try {
        const complement =
          entry.l && entry.c.includes("comp.")
            ? dictionary.findOneByTs(entry.l)
            : undefined;
        const verbInfo = getVerbInfo(entry, complement);
        const initialResults = searchPile(verbInfo as any, preSearchFun);
        if (!initialResults.length) return all;
        const conjugation = conjugateVerb(entry, complement);
        const forms = searchPile(conjugation as any, searchFun);
        if (forms.length) {
          return [...all, { entry, forms }];
        }
        return all;
      } catch (e) {
        console.error(e);
        console.error("error inflecting", entry.p);
        return all;
      }
    }
    if (entry.c && type === "nounAdj") {
      try {
        const inflections = inflectWord(entry);
        if (!inflections) return all;
        const forms = searchPile(inflections as any, searchFun);
        if (forms.length) {
          return [...all, { entry, forms }];
        }
      } catch (e) {
        console.log("error inflecting word in inflections search");
        console.error(e);
      }
    }
    return all;
  }, []);
  // console.timeEnd(timerLabel);
  // TODO!!: Sorting on this as well
  const allResults = ["را", "ور", "در"].includes(searchValue.slice(0, 2))
    ? [
        ...results,
        // also search without the directional pronoun
        ...searchAllInflectionsCore(allDocs, searchValue.slice(2)),
      ]
    : ["raa", "war", "dar", "wăr", "dăr"].includes(searchValue.slice(0, 3))
    ? [
        ...results,
        // also search without the directional pronoun
        ...searchAllInflectionsCore(allDocs, searchValue.slice(3)),
      ]
    : results;
  // because we used a bit of a fuzzy search, sort the results by relevancy
  // this is a bit complicated...
  return sortResultsByRelevancy(allResults.map(sortMatchesByRelevancy));
}
