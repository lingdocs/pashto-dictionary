import {
  conjugateVerb,
  Types as T,
  removeFVarients,
  splitPsString,
  inflectWord,
} from "@lingdocs/inflect";
import { typePredicates as tp } from "@lingdocs/inflect";

export type PsHash = `${string}X${string}`;

export function psHash(o: T.PsWord): PsHash {
  if ("hyphen" in o && o.hyphen) {
    return o.hyphen.reduce((acc, h) => {
      return (acc + `-${h.type === "written" ? h.p : ""}X${h.f}`) as PsHash;
    }, `${o.p}X${o.f}` as PsHash);
  }
  return `${o.p}X${o.f}`;
}

export function dePsHash(h: PsHash): T.PsWord {
  function deHashHyphenContents(c: string[]): T.HyphenPsContent[] {
    return c.reduce<T.HyphenPsContent[]>((acc, x) => {
      const [p, f] = x.split("X");
      const n: T.HyphenPsContent =
        p === ""
          ? {
              type: "unwritten",
              f,
            }
          : {
              type: "written",
              p,
              f,
            };
      return [...acc, n];
    }, []);
  }
  const [first, ...rest] = h.split("-");
  const [p, f] = first.split("X");
  if (rest.length === 0) {
    return { p, f };
  }
  return {
    p,
    f,
    hyphen: deHashHyphenContents(rest),
  };
}

function search(object: any): Set<PsHash> {
  const fieldsToIgnore = ["info", "type", "perfectiveSplit"];
  let splitError: any = false;
  // adapted from
  // https://www.mikedoesweb.com/2016/es6-depth-first-object-tree-search/
  function inside(haystack: any, found: Set<PsHash>): Set<PsHash> {
    if (haystack === null) {
      return found;
    }
    Object.keys(haystack).forEach((key: string) => {
      if (fieldsToIgnore.includes(key)) {
        return;
      }
      if (key === "p" && typeof haystack[key] === "string") {
        try {
          splitPsString(haystack).forEach((word) => {
            found.add(psHash(word));
          });
        } catch (e) {
          splitError = { haystack };
        }
        return;
      }
      if (typeof haystack[key] === "object") {
        inside(haystack[key], found);
      }
      return;
    });
    return found;
  }
  const r = inside(object, new Set<PsHash>());
  if (splitError) {
    console.log(splitError);
  }
  return r;
}

export function getWordList(entries: T.DictionaryEntry[]):
  | {
      ok: true;
      wordlist: T.PsWord[];
    }
  | {
      ok: false;
      errors: T.DictionaryEntryError[];
    } {
  const allWords = new Set<PsHash>();
  entries.forEach((entry) => {
    const words = splitPsString(removeFVarients({ p: entry.p, f: entry.f }));
    words.forEach((w) => allWords.add(psHash(w)));
    if (tp.isNounOrAdjEntry(entry)) {
      try {
        const infs = inflectWord(entry);
        if (infs) {
          search(infs).forEach((x) => allWords.add(x));
        }
      } catch (e) {
        console.error("error inflecting word");
        console.error(e);
      }
    } else if (tp.isVerbDictionaryEntry(entry)) {
      const linked = entry.l
        ? entries.find((e) => e.ts === entry.l)
        : undefined;
      try {
        const conj = conjugateVerb(entry, linked);
        search(conj).forEach((x) => allWords.add(x));
      } catch (e) {
        console.error("error conjugating verb");
        console.error(e);
      }
    }
  });
  // const errors: T.DictionaryEntryError[] = [];
  // function getNounAdjInflections(entry: T.DictionaryEntry) {
  //     const infs = inflectWord(entry);
  //     if (infs) {
  //         search(infs).forEach(x => allInflections.add(x));
  //     } else {
  //         allInflections.add(psHash(removeFVarients(entry)));
  //     }
  // }
  // function getVerbConjugations(word: T.DictionaryEntry, linked?: T.DictionaryEntry) {
  //     search(conjugateVerb(word, linked)).forEach(x => allInflections.add(x));
  // }
  // // got the entries, make a wordList of all the possible inflections
  // entries.forEach((entry) => {
  //     try {
  //         if (entry.c?.startsWith("v. ")) {
  //             const linked = entry.l ? entries.find((e) => e.ts === entry.l) : undefined;
  //             getVerbConjugations(entry, linked);
  //         } else if (isNounOrAdjEntry(entry as T.Entry)) {
  //             getNounAdjInflections(entry);
  //         } else {
  //             allInflections.add(psHash(removeFVarients(entry)));
  //         }
  //     } catch (error) {
  //         console.log({ entry, error });
  //         errors.push({
  //             ts: entry.ts,
  //             p: entry.p,
  //             f: entry.f,
  //             e: entry.e,
  //             erroneousFields: [],
  //             errors: ["error inflecting/conjugating entry"],
  //         });
  //     }
  // });
  // if (errors.length) {
  //     return ({
  //         ok: false,
  //         errors,
  //     });
  // }

  // // add ی version of words with ې (to accomadate for some bad spelling)
  // // allInflections.forEach((word: string) => {
  // //     // for words with ې in the middle, also have a version with ی in the middle instead
  // //     // if (eInMiddleRegex.test(word)) {
  // //     //     allInflections.add(word.replace(eInMiddleRegex, "ی"));
  // //     // }
  // //     // for words ending in ې, also have a version ending in ي
  // //     // if (word.slice(-1) === "ې") {
  // //     //     allInflections.add(word.slice(0, -1) + "ي");
  // //     // }
  // // });
  // // const wordlist = Array.from(allInflections).filter((s) => !(s.includes(".") || s.includes("?")));
  // // wordlist.sort((a, b) => a.localeCompare(b, "ps"));
  const wordlist: T.PsWord[] = [];
  allWords.forEach((x) => {
    wordlist.push(dePsHash(x));
  });
  wordlist.sort((a, b) => a.p.localeCompare(b.p, "ps"));
  return {
    ok: true,
    wordlist,
  };
}

// const eInMiddleRegex = new RegExp("ې(?=[\u0621-\u065f\u0670-\u06d3\u06d5])", "g");
