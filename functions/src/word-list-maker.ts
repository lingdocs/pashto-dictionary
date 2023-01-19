import { 
    inflectWord,
    conjugateVerb,
    Types as T,
    removeFVarients,
} from "@lingdocs/inflect";
import { isNounOrAdjEntry } from "@lingdocs/inflect/dist/lib/src/type-predicates";
import {
    uniqWith,
    isEqual,
} from "lodash";


// will return { p: "", f: "", s: "" }
function search(object: any): T.PsString[] {
    // adapted from
    // https://www.mikedoesweb.com/2016/es6-depth-first-object-tree-search/
    function inside(haystack: any, found: T.PsString[]): T.PsString[] {
        // use uniqueObjects = _.uniqWith(objects, _.isEqual)
        // instead of set
        if (haystack === null) {
            return found;
        }
        Object.keys(haystack).forEach((key: string) => {
            if(key === "p" && typeof haystack[key] === "string") {
                // todo: rather get the p and f
                // TODO: split words into individual words
                // haystack[key].split(" ").forEach((word: string) => {
                //     found.(word);
                // });
                found.push(haystack as T.PsString)
                return;
            }
            if(typeof haystack[key] === 'object') {
                inside(haystack[key], found);
            }
            return;
        });
        return found;
    };
    return uniqWith(inside(object, []), isEqual);
}

export function getWordList(entries: T.DictionaryEntry[]): {
    ok: true,
    wordlist: T.PsString[],
} | {
    ok: false,
    errors: T.DictionaryEntryError[],
} {
    let allInflections: T.PsString[] = [];
    function addPs(ps: T.PsString) {
        if (!allInflections.find(x => !(x.p === ps.p && x.f === ps.f))) {
            allInflections.push(ps);
        };
    }
    const errors: T.DictionaryEntryError[] = [];
    function getNounAdjInflections(entry: T.DictionaryEntry) {
        const infs = inflectWord(entry);
        if (infs) {
            search(infs).forEach(addPs);
        }
    }
    function getVerbConjugations(word: T.DictionaryEntry, linked?: T.DictionaryEntry) {
        search(conjugateVerb(word, linked)).forEach(addPs);
    }
    // got the entries, make a wordList of all the possible inflections
    entries.forEach((entry) => {
        try {
            if (entry.c?.startsWith("v. ")) {
                const linked = entry.l ? entries.find((e) => e.ts === entry.l) : undefined;
                getVerbConjugations(entry, linked);
            } else if (isNounOrAdjEntry(entry as T.Entry)) {
                getNounAdjInflections(entry);
            } else {
                addPs(removeFVarients({ p: entry.p, f: entry.f }));
            }
        } catch (error) {
            errors.push({
                ts: entry.ts,
                p: entry.p,
                f: entry.f,
                e: entry.e,
                erroneousFields: [],
                errors: ["error inflecting/conjugating entry"],
            });
        }
    });
    if (errors.length) {
        return ({
            ok: false,
            errors,
        });
    }

    // add ی version of words with ې (to accomadate for some bad spelling)
    // allInflections.forEach((word: string) => {
    //     // for words with ې in the middle, also have a version with ی in the middle instead
    //     // if (eInMiddleRegex.test(word)) {
    //     //     allInflections.add(word.replace(eInMiddleRegex, "ی"));
    //     // }
    //     // for words ending in ې, also have a version ending in ي
    //     // if (word.slice(-1) === "ې") {
    //     //     allInflections.add(word.slice(0, -1) + "ي");
    //     // }
    // });
    // const wordlist = Array.from(allInflections).filter((s) => !(s.includes(".") || s.includes("?")));
    // wordlist.sort((a, b) => a.localeCompare(b, "ps"));
    return {
        ok: true,
        wordlist: allInflections,
    };
}

// const eInMiddleRegex = new RegExp("ې(?=[\u0621-\u065f\u0670-\u06d3\u06d5])", "g");
