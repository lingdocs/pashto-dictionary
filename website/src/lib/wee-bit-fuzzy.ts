/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// const matcher = {
//     q: "[q|k]",
//     k: "[q|k]",
//     // TODO: this might not be the best way to handle
//     // double aa's passing as a's - because it can totally ignore the a's
//     a: "[a|á|ă]?a?",
//     á: "[a|á|ă]?a?",
//     ă: "[a|á|ă]?a?",
//     u: "[u|ú]",
//     ú: "[u|ú]",
//     e: "[e|é]",
//     é: "[e|é]",
//     i: "[i|í]",
//     í: "[i|í]",
//     o: "[o|ó]",
//     ó: "[o|ó]",
//     g: "[g|G]",
//     G: "[g|G]",
//     r: "[r|R]",
//     R: "[r|R]",
// };

const fiveYeys = "[ئ|ۍ|ي|ې|ی]";
const sSounds = "[س|ص|ث|څ]";
const zSounds = "[ز|ژ|ض|ظ|ذ|ځ]";
const tSounds = "[ت|ط|ټ]";
const dSounds = "[د|ډ]";
const rSounds = "[ر|ړ|ڼ]";
const nSounds = "[ن|ڼ]";

const pReplacer = {
    "ی": fiveYeys,
    "ي": fiveYeys,
    "ۍ": fiveYeys,
    "ئ": fiveYeys,
    "ې": fiveYeys,

    "س": sSounds,
    "ص": sSounds,
    "ث": sSounds,
    "څ": sSounds,

    "ز": zSounds,
    "ظ": zSounds,
    "ذ": zSounds,
    "ض": zSounds,
    "ژ": zSounds,
    "ځ": zSounds,

    "ت": tSounds,
    "ط": tSounds,
    "ټ": tSounds,

    "د": dSounds,
    "ډ": dSounds,

    "ر": rSounds,
    "ړ": rSounds,

    "ن": nSounds,
    "ڼ": nSounds,
};

const fiveYeysF = "(?:eyy|ey|ee|e|uy)";
const zSoundsF = "(?:z|dz)";

const fReplacer = {
    "eyy": fiveYeysF,
    "ey": fiveYeysF,
    "uy": fiveYeysF,
    "ee": fiveYeysF,
    "e": fiveYeysF,

    "z": zSoundsF,
    "dz": zSoundsF,
};

const pRepRegex = new RegExp(Object.keys(pReplacer).join("|"), "g");

const fRepRegex = /eyy|ey|uy|ee|e|z|dz/g;

function makePAWeeBitFuzzy(s: string): string {
    // + s.replace(/ /g, "").split("").join(" *");
    return "^" + s.replace(pRepRegex, mtch => {
        // @ts-ignore
        return pReplacer[mtch];
    });
}

function makeFAWeeBitFuzzy(s: string): string {
    return "^" + s.replace(fRepRegex, mtch => {
        // @ts-ignore
        return fReplacer[mtch];
    });
}

export function makeAWeeBitFuzzy(s: string, i: "f" | "p"): string {
    return i === "p"
        ? makePAWeeBitFuzzy(s)
        : makeFAWeeBitFuzzy(s);
}