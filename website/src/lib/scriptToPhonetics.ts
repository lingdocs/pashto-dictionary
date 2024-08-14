import { conjugateVerb, getVerbInfo, inflectWord, isNounAdjOrVerb, isPashtoScript, removeFVarients, standardizePashto } from "@lingdocs/ps-react";
import { dictionary, allEntries } from "./dictionary";
import {
    Types as T,
} from "@lingdocs/ps-react";
import {
    InflectionSearchResult,
} from "../types/dictionary-types";
import { searchPile } from "./search-pile";

/**
 * Converts some Pashto texts to phonetics by looking up each word in the dictionary and finding 
 * the phonetic equivalent
 * 
 * @param p 
 * @returns 
 */
export function scriptToPhonetics(p: string): string {
    const words = splitWords(p);
    const entries = allEntries();
    const f = (w: string) => wordToPhonetics(w, entries);
    return words.map(f).join("");
}


function wordToPhonetics(p: string, entries: T.DictionaryEntry[]): string {
    if (!isPashtoScript(p)) {
        return p;
    }
    const results = dictionary.exactPashtoSearch(p);
    const entryFs = results.map(entry => removeFVarients(entry.f));
    const inflectionsR = searchAllInflectionsCore(entries, p);
    // TODO: also add directional prefix stuff
    const inflections = inflectionsR.map(result => result.forms)
            .flatMap(form => form.flatMap(x => x.matches.map(x => x.ps.f)));
    const possibilities = [...new Set([...entryFs, ...inflections])];
    if (possibilities.length === 0) {
        return p;
    }
    return possibilities.join("/");
}

export function searchAllInflectionsCore(allDocs: T.DictionaryEntry[], searchValue: string): InflectionSearchResult[] {
    const preSearchFun = (ps: T.PsString) => ps.p.slice(0, 2) === searchValue.slice(0, 2);
    const searchFun = (ps: T.PsString) => ps.p === searchValue;
    // console.time(timerLabel);
    return allDocs.reduce((all: InflectionSearchResult[], entry) => {
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
                const forms = searchPile(
                    conjugation as any,
                    searchFun,
                );
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
            const inflections = inflectWord(entry);
            if (!inflections) return all;
            const forms = searchPile(inflections as any, searchFun);
            if (forms.length) {
                return [...all, { entry, forms }];
            }
        }
        return all;
    }, []);
}

function splitWords(p: string): string[] {
    function isP(c: string): boolean {
        return !!c.match(/[\u0621-\u065f\u0670-\u06d3\u06d5]/);
    }
    const words: string[] = [];
    let current = "";
    let onP: boolean = true;
    const chars = p.split("");
    for (let char of chars) {
        const p = isP(char);
        if (p) {
            if (onP) {
                current += char;
            } else {
                words.push(current);
                current = char;
                onP = true;
            }
        } else {
            if (onP) {
                words.push(current);
                current = char;
                onP = false;
            } else {
                current += char;
            }
        }
    }
    words.push(current);
    return words.map(standardizePashto);
}