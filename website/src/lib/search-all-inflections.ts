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

// 1st iteration: Brute force make every single conjugation and check all - 5300ms
// 2nd iteration: Check if it makes a big difference to search via function - 5100ms
// 3rd interation: First check for the first two letters in the verb info
//    if present, conjugation and search the whole conjugation 255ms !! 🎉💪
//    That's so much better I'm removing the option of skipping compounds
// ~4th iteration:~ ignore perfective or imperfective if wasn't present in verb info (not worth it - scrapped)

function fFuzzy(f: string): string {
    return f.replace(/e|é/g, "[e|é]")
        .replace(/i|í/g, "[i|í]")
        .replace(/o|ó/g, "[o|ó]")
        .replace(/u|ú/g, "[u|ú]")
        .replace(/a|á/g, "[a|á]")
        .replace(/U|Ú/g, "[Ú|U]");
}

export function searchAllInflections(allDocs: T.DictionaryEntry[], searchValue: string): { entry: T.DictionaryEntry, results: InflectionSearchResult[] }[] {
    // const timerLabel = "Search inflections";
    const beg = fFuzzy(searchValue.slice(0, 2));
    const preSearchFun = isPashtoScript(searchValue)
        ? (ps: T.PsString) => ps.p.slice(0, 2) === beg
        : (ps: T.PsString) => !!ps.f.slice(0, 2).match(beg);
    const fRegex = new RegExp("^" + fFuzzy(searchValue) + "$");
    const searchFun = isPashtoScript(searchValue)
        ? (ps: T.PsString)  =>  ps.p === searchValue
        : (ps: T.PsString) => !!ps.f.match(fRegex);
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
    return results;
}