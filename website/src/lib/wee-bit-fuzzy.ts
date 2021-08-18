/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const matcher = {
    q: "[q|k]",
    k: "[q|k]",
    // TODO: this might not be the best way to handle
    // double aa's passing as a's - because it can totally ignore the a's
    a: "[a|á|ă]?a?",
    á: "[a|á|ă]?a?",
    ă: "[a|á|ă]?a?",
    u: "[u|ú]",
    ú: "[u|ú]",
    e: "[e|é]",
    é: "[e|é]",
    i: "[i|í]",
    í: "[i|í]",
    o: "[o|ó]",
    ó: "[o|ó]",
    g: "[g|G]",
    G: "[g|G]",
    r: "[r|R]",
    R: "[r|R]",
};

const fRepRegex = /r|R|q|k|a|á|ă|e|é|i|í|o|ó|g|G|u|ú/g;

export function makeAWeeBitFuzzy(s: string, i: "f" | "p"): string {
    const logic = i === "f"
        ? "^" + s.replace(/ /g, "").split("").join("['|`]? *").replace(fRepRegex, (mtch) => {
                // @ts-ignore
                return matcher[mtch];
            })
        : "^" + s.replace(/ /g, "").split("").join(" *");
    return logic;
}