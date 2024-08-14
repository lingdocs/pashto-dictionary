/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
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

const fiveYays = "[ئ|ۍ|ي|ې|ی]";
const sSounds = "[س|ص|ث|څ]";
const zSounds = "[ز|ژ|ض|ظ|ذ|ځ]";
const tSounds = "[ت|ط|ټ]";
const dSounds = "[د|ډ]";
const rSounds = "[ر|ړ|ڼ]";
const nSounds = "[ن|ڼ]";
const hKhSounds = "[خ|ح|ښ|ه]";
const alef = "[آ|ا]";

const pReplacer = {
  ی: fiveYays,
  ي: fiveYays,
  ۍ: fiveYays,
  ئ: fiveYays,
  ې: fiveYays,

  س: sSounds,
  ص: sSounds,
  ث: sSounds,
  څ: sSounds,

  ز: zSounds,
  ظ: zSounds,
  ذ: zSounds,
  ض: zSounds,
  ژ: zSounds,
  ځ: zSounds,

  ت: tSounds,
  ط: tSounds,
  ټ: tSounds,

  د: dSounds,
  ډ: dSounds,

  ر: rSounds,
  ړ: rSounds,

  ن: nSounds,
  ڼ: nSounds,

  خ: hKhSounds,
  ح: hKhSounds,
  ښ: hKhSounds,
  ه: hKhSounds,

  ا: alef,
  آ: alef,
};

const fiveYaysF = "(?:ey|ay|ee|é|e|uy)";
const hKhF = "(?:kh|h|x)";
const zSoundsF = "(?:z|dz)";
const sSoundsF = "(?:ts|s)";

const fReplacer = {
  ey: fiveYaysF,
  ay: fiveYaysF,
  uy: fiveYaysF,
  ee: fiveYaysF,
  e: fiveYaysF,

  z: zSoundsF,
  dz: zSoundsF,
  x: hKhF,
  h: hKhF,
  kh: hKhF,
  ts: sSoundsF,
  s: sSoundsF,
  a: "[a|á|u|ú]",
  á: "[a|á|u|ú]",
  u: "[u|ú|a|á]",
  ú: "[u|ú|a|á]",
  o: "[o|ó]",
  ó: "[o|ó]",
  i: "[i|í]",
  í: "[i|í]",
  U: "[U|Ú]",
  Ú: "[U|Ú]",
  áy: fiveYaysF,
  éy: fiveYaysF,
  úy: fiveYaysF,
  ée: fiveYaysF,
  é: fiveYaysF,
};

const pRepRegex = new RegExp(Object.keys(pReplacer).join("|"), "g");

const fRepRegex = /ey|ay|uy|ee|a|u|e|z|dz|x|kh|h|ts|s/g;

const fRepRegexWAccents =
  /ey|éy|ay|áy|uy|úy|ee|ée|e|é|z|dz|x|ts|s|kh|h|a|á|i|í|o|ó|u|ú|U|Ú/g;

function makePAWeeBitFuzzy(s: string): string {
  // + s.replace(/ /g, "").split("").join(" *");
  return (
    "^" +
    s.replace(pRepRegex, (mtch) => {
      // @ts-ignore
      return `${pReplacer[mtch]}`;
    })
  );
}

function makeFAWeeBitFuzzy(s: string, ignoreAccent?: boolean): string {
  return (
    "^" +
    s.replace(ignoreAccent ? fRepRegexWAccents : fRepRegex, (mtch) => {
      // @ts-ignore
      return fReplacer[mtch];
    })
  );
}

export function makeAWeeBitFuzzy(
  s: string,
  i: "f" | "p",
  ignoreAccent?: boolean
): string {
  return i === "p" ? makePAWeeBitFuzzy(s) : makeFAWeeBitFuzzy(s, ignoreAccent);
}
