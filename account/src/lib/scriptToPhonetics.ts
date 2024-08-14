import {
    Types as T,
    standardizePashto,
    removeAccents,
} from "@lingdocs/inflect";
import { findInAllWords } from "./dictionary";
import {
    handlePunctuationAndNums,
    handleUnmatched,
} from "./handle-unmatched";


// TODO: handle و ارزي
// spacing error with کور کې چېرته اوسېږئ

function isP(c: string): boolean {
    return !!c.match(/[\u0621-\u065f\u0670-\u06d3\u06d5]/);
}

// TODO: ERRORING WHEN YOU JUST PUT A BUNCH OF ENGLISH CHARS IN THE TEXT

/**
 * Converts some Pashto texts to phonetics by looking up each word in the dictionary and finding 
 * the phonetic equivalent
 * 
 * @param p 
 * @returns 
 */
export function scriptToPhonetics(p: string, accents: boolean): {
    phonetics: string,
    missing: string[],
} {
    const words = splitWords(standardizePashto(p));
    if (!words.length) return {
        phonetics: "",
        missing: [],
    }
    // TODO: keep going with the hyphens etc
    // also و ارزي
    const converted: string[] = [];
    const missing = new Set<string>();
    let i = 0;
    function handleAccents(f: string): string {
        return accents ? f : removeAccents(f);
    }
    function checkHyphenMatch(psw: T.PsWord): {
        match: boolean,
        words: number,
        f: string,
    } {
        if (!psw.hyphen) {
            throw new Error("checking a match without a hyphen content");
        }
        let match = false;
        let f = psw.f;
        let k = 1;
        for (let j = 0; j < psw.hyphen.length; j++) {
            const h = psw.hyphen[j];
            const w = words[i+k];
            if (h.type === "unwritten" && w === " ") {
                match = true;
                f += `-${h.f}`;
                k += 1;
            } else if (h.type === "written" && w === h.p) {
                match = true;
                f += `-${h.f}`;
                k += 1;
            } else if (h.type === "written" && w === " " && words[i+1+k] === h.p) {
                match = true;
                f += `-${h.f}`;
                k += 2;
            } else {
                match = false;
                break;
            }
        }
        return {
            match,
            f,
            words: k,
        }
    }
    function handleMatches(matches: T.PsWord[]): string[] {
        const hyphens = matches.filter(x => x.hyphen);
        const plain = matches.filter(x => !x.hyphen);
        const processed = new Set<string>();
        if (hyphens.length) {
            for (let h of hyphens) {
                const res = checkHyphenMatch(h);
                if (res.match) {
                    i += res.words;
                    processed.add(handleAccents(res.f));
                    break;
                }
            }
        } else if (hyphens.length && !plain.length) {
            processed.add("ERR");
            i++;
        } {
            plain.forEach((x) => {
                processed.add(handleAccents(x.f));
            });
            i++;
        }
        return Array.from(processed);
    }
    while (i < words.length) {
        const word = words[i];
        const p = isP(word);
        if (p) {
            const matches = findInAllWords(possibleFuzzify(word));
            if (!matches) {
                throw new Error("not initialized");
            }
            if (matches.length > 0) {
                const possibilities = handleMatches(matches);
                converted.push(possibilities.join("/"));
            } else {
                missing.add(word);
                converted.push(handleUnmatched(word));
                i++;
            }
        } else {
            converted.push(handlePunctuationAndNums(word));
            i++;
        }
    }
    return {
        phonetics: converted.join(""),
        missing: Array.from(missing),
    };
}

function splitWords(p: string): string[] {
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
    return words;
}

function possibleFuzzify(s: string): string | RegExp {
    if (s.length < 3) {
        return s;
    }
    const middle = s.slice(1, -1);
    if (middle.includes("ې") || middle.includes("ی")) {
        return new RegExp(`^${s[0]}${middle.replace(/[ی|ې]/g, "[ې|ی]")}${s.slice(-1)}$`);
    } else {
        return s;
    }
}