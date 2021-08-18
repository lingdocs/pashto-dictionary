import { 
    inflectWord,
    conjugateVerb,
    Types as T,
    pashtoConsonants,
    isNounAdjOrVerb,
} from "@lingdocs/pashto-inflector";


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
        if (entry.app) allInflections.add(entry.app);
        if (entry.ppp) allInflections.add(entry.ppp);
        
        const inflections = inflectWord(entry);
        const wordsFromInf = inflections
            ? search("p", inflections)
            : [];
        wordsFromInf.forEach(w => allInflections.add(w));
    }
    function getVerbConjugations(word: T.DictionaryEntry, linked?: T.DictionaryEntry) {
        const pWords = search("p", conjugateVerb(word, linked));
        pWords.forEach(w => allInflections.add(w));
    }
    // got the entries, make a wordList of all the possible inflections
    entries.forEach((entry) => {
        try {
            if (entry.c && isNounAdjOrVerb(entry) === "nounAdj") {
                // it's a noun/adjective - get all inflections and plurals etc.
                getNounAdjInflections(entry);
                // hack to add some plurals and mayonnaise
                if (entry.c.includes("n. m.") && pashtoConsonants.includes(entry.p.slice(-1))) {
                    allInflections.add(entry.p + "ونه")
                    allInflections.add(entry.p + "ونو")
                    allInflections.add(entry.p + "ه");
                }
                if (entry.c.includes("n. f.") && entry.p.slice(-1) === "ا") {
                    allInflections.add(entry.p + "ګانې")
                    allInflections.add(entry.p + "ګانو");
                }
            } else if (entry.c && isNounAdjOrVerb(entry) === "verb") {
                // it's a verb - get all the conjugations for it
                if (entry.l && entry.c.includes("comp.")) {
                    // it's a compound verb, conjugate it with the linked complement
                    const linkedEntry = entries.find((e) => e.ts === entry.l);
                    getVerbConjugations(entry, linkedEntry);
                } else {
                    // it's a non-compound verb, conjugate it
                    getVerbConjugations(entry);
                }
            } else {
                // it's something else, just put the word(s) in
                entry.p.split(" ").forEach(w => allInflections.add(w));
            }
        } catch (error) {
            errors.push({
                ts: entry.ts,
                p: entry.p,
                f: entry.f,
                e: entry.e,
                erroneousFields: [],
                errors: ["error inflecting/conjugating entry", error.toString()],
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
    allInflections.forEach((word: string) => {
        // for words with ې in the middle, also have a version with ی in the middle instead
        if (eInMiddleRegex.test(word)) {
            allInflections.add(word.replace(eInMiddleRegex, "ی"));
        }
        // for words ending in ې, also have a version ending in ي
        if (word.slice(-1) === "ې") {
            allInflections.add(word.slice(0, -1) + "ي");
        }
    });
    const wordlist = Array.from(allInflections).filter((s) => !(s.includes(".") || s.includes("?")));
    wordlist.sort((a, b) => a.localeCompare(b, "ps"));
    return {
        ok: true,
        wordlist,
    };
}

const eInMiddleRegex = new RegExp("ې(?=[\u0621-\u065f\u0670-\u06d3\u06d5])", "g");
