import { searchPile } from "../lib/search-pile";
import { 
    isNounAdjOrVerb,
} from "@lingdocs/pashto-inflector";
import { dictionary } from "../lib/dictionary";
import {
    conjugateVerb,
    inflectWord,
    Types as T,
    getVerbInfo,
} from "@lingdocs/pashto-inflector";
import { isPashtoScript } from "./is-pashto";
import {
    InflectionSearchResult,
} from "../types/dictionary-types";
import { makeAWeeBitFuzzy } from "./wee-bit-fuzzy";

// 1st iteration: Brute force make every single conjugation and check all - 5300ms
// 2nd iteration: Check if it makes a big difference to search via function - 5100ms
// 3rd interation: First check for the first two letters in the verb info
//    if present, conjugation and search the whole conjugation 255ms !! 🎉💪
//    That's so much better I'm removing the option of skipping compounds
// ~4th iteration:~ ignore perfective or imperfective if wasn't present in verb info (not worth it - scrapped)

export function searchAllInflections(allDocs: T.DictionaryEntry[], searchValue: string): { entry: T.DictionaryEntry, results: InflectionSearchResult[] }[] {
    // const timerLabel = "Search inflections";
    const script = isPashtoScript(searchValue) ? "p" : "f";
    const begRegex = new RegExp(
        makeAWeeBitFuzzy(searchValue.slice(0, 3), script, true),
        "i",
    );
    const preSearchFun = (ps: T.PsString) => !!ps[script].match(begRegex);
    const searchRegex = new RegExp(
        makeAWeeBitFuzzy(searchValue, script, true) + "$",
        "i",
    );
    // add little bit fuzzy
    // also do version without directional pronoun on front
    const searchFun = (ps: T.PsString) => !!ps[script].match(searchRegex)
    // console.time(timerLabel);
    const results = allDocs.reduce((all: { entry: T.DictionaryEntry, results: InflectionSearchResult[] }[], entry) => {
        const type = isNounAdjOrVerb(entry);
        if (entry.c && type === "verb") {
            try {
                const complement = (entry.l && entry.c.includes("comp.")) ? dictionary.findOneByTs(entry.l) : undefined;
                const verbInfo = getVerbInfo(entry, complement);
                const initialResults = searchPile(verbInfo as any, preSearchFun);
                if (!initialResults.length) return all;
                const conjugation = conjugateVerb(
                    entry,
                    complement,
                );
                const results = searchPile(
                    conjugation as any,
                    searchFun,
                );
                if (results.length) {
                    return [...all, { entry, results }];
                }
                return all;
            } catch (e) {
                console.error(e);
                console.error("error inflecting", entry.p);
                return all;
            }
        }
        if (entry.c && type === "nounAdj") {
            const inflections = inflectWord(entry);
            if (!inflections) return all;
            const results = searchPile(inflections as any, searchFun);
            if (results.length) {
                return [...all, { entry, results }];
            }
        }
        return all;
    }, []);
    // console.timeEnd(timerLabel);
    if (["را", "ور", "در"].includes(searchValue.slice(0, 2))) {
        return [
            ...results,
            // also search without the directionary pronoun
            ...searchAllInflections(allDocs, searchValue.slice(2)),
        ];
    }
    if (["raa", "war", "dar", "wăr", "dăr"].includes(searchValue.slice(0, 3))) {
        return [
            ...results,
            // also search without the directionary pronoun
            ...searchAllInflections(allDocs, searchValue.slice(3)),
        ];
    }
    return results;
}