import { 
    inflectWord,
    conjugateVerb,
    Types as T,
} from "@lingdocs/inflect";


function search(key: string, object: any): string[] {
    // adapted from
    // https://www.mikedoesweb.com/2016/es6-depth-first-object-tree-search/
    function inside(needle: string, haystack: any, found: Set<string> = new Set()): Set<string> {
        if (haystack === null) {
            return found;
        }
        Object.keys(haystack).forEach((key: string) => {
            if(key === needle && typeof haystack[key] === "string") {
                haystack[key].split(" ").forEach((word: string) => {
                    found.add(word);
                });
                return;
            }
            if(typeof haystack[key] === 'object') {
                inside(needle, haystack[key], found);
            }
            return;
        });
        return found;
    };
    return Array.from(inside(key, object));
}

export function getWordList(entries: T.DictionaryEntry[]): {
    ok: true,
    wordlist: string[],
} | {
    ok: false,
    errors: T.DictionaryEntryError[],
} {
    const allInflections: Set<string> = new Set();
    const errors: T.DictionaryEntryError[] = [];
    function getNounAdjInflections(entry: T.DictionaryEntry) {
        const infs = inflectWord(entry);
        if (infs) {
            search("p", infs).forEach(w => allInflections.add(w));
        }
    }
    function getVerbConjugations(word: T.DictionaryEntry, linked?: T.DictionaryEntry) {
        search("p", conjugateVerb(word, linked)).forEach(w => allInflections.add(w));
    }
    // got the entries, make a wordList of all the possible inflections
    entries.forEach((entry) => {
        try {
            if (entry.c?.startsWith("v. ")) {
                const linked = entry.l ? entries.find((e) => e.ts === entry.l) : undefined;
                getVerbConjugations(entry, linked);
            }
            getNounAdjInflections(entry);
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
    const wordlist = Array.from(allInflections).filter((s) => !(s.includes(".") || s.includes("?")));
    wordlist.sort((a, b) => a.localeCompare(b, "ps"));
    return {
        ok: true,
        wordlist,
    };
}

// const eInMiddleRegex = new RegExp("ې(?=[\u0621-\u065f\u0670-\u06d3\u06d5])", "g");
