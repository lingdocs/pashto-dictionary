import { 
    inflectWord,
    conjugateVerb,
    Types as T,
    removeFVarients,
} from "@lingdocs/inflect";
import { isNounOrAdjEntry } from "@lingdocs/inflect/dist/lib/src/type-predicates";

type PSHash = `${string}X${string}`;

function makeHash(o: T.PsString): PSHash {
    return `${o.p}X${o.f}`;
}

export function splitWords(o: T.PsString): T.PsString[] {
    function splitR(o: { p: string[], f: string[] }): T.PsString[] {
        const [lastP, ...restP] = o.p;
        const [lastF, ...restF] = o.f;
        if (!restF.length || !restP.length) {
            return [{
                p: [lastP, ...restP].reverse().join(" "),
                f: [lastF, ...restF].reverse().join(" "),
            }];
        }
        const lastWord: T.PsString = {
            p: lastP,
            f: lastF,
        };
        return [lastWord, ...splitR({ p: restP, f: restF })];
    }
    return splitR({
        p: o.p.split(" ").reverse(),
        f: o.f.split(" ").reverse(),
    }).reverse();
}

// will return { p: "", f: "", s: "" }
function search(object: any): Set<PSHash> {
    // adapted from
    // https://www.mikedoesweb.com/2016/es6-depth-first-object-tree-search/
    function inside(haystack: any, found: Set<PSHash>): Set<PSHash> {
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
                splitWords(haystack).forEach(word => {
                    found.add(makeHash(word));
                });
                return;
            }
            if(typeof haystack[key] === 'object') {
                inside(haystack[key], found);
            }
            return;
        });
        return found;
    };
    return inside(object, new Set<PSHash>());
}

export function getWordList(entries: T.DictionaryEntry[]): {
    ok: true,
    wordlist: T.PsString[],
} | {
    ok: false,
    errors: T.DictionaryEntryError[],
} {
    const allInflections = new Set<PSHash>();
    const errors: T.DictionaryEntryError[] = [];
    function getNounAdjInflections(entry: T.DictionaryEntry) {
        const infs = inflectWord(entry);
        if (infs) {
            search(infs).forEach(x => allInflections.add(x));
        } else {
            allInflections.add(makeHash(removeFVarients(entry)));
        }
    }
    function getVerbConjugations(word: T.DictionaryEntry, linked?: T.DictionaryEntry) {
        search(conjugateVerb(word, linked)).forEach(x => allInflections.add(x));
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
                allInflections.add(makeHash(removeFVarients(entry)));
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
    const wordlist: T.PsString[] = [];
    allInflections.forEach(x => {
        const [p, f] = x.split("X");
        wordlist.push({ p, f });
    });
    wordlist.sort((a, b) => a.p.localeCompare(b.p, "ps"));
    return {
        ok: true,
        wordlist,
    };
}

// const eInMiddleRegex = new RegExp("ې(?=[\u0621-\u065f\u0670-\u06d3\u06d5])", "g");
