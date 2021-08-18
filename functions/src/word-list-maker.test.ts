import { getWordList } from "./word-list-maker";

const entries = [
    { "ts": 0, p:"???", f: "abc", e: "oeu", g: "coeuch", i: 0 },
    {"ts":1581189430959,"p":"پېش","f":"pesh","e":"ahead, in front; earlier, first, before","c":"adv.","g":"pesh","i":2574},
    {"i":4424,"g":"cherta","ts":1527812531,"p":"چېرته","f":"cherta","e":"where (also used for if, when)"},
    {"i":5389,"g":"daase","ts":1527812321,"p":"داسې","f":"daase","e":"such, like this, like that, like","c":"adv."},
];
const expectedInflections = [
    "پیش",
    "پېش",
    "چیرته",
    "چېرته",
    "داسي",
    "داسې",
];

describe('Make Wordlist', () => {
  it("should return all inflections that can be generated from given entries", () => {
    const response = getWordList(entries);
    expect(response.ok).toBe(true);
    expect("wordlist" in response).toBe(true);
    if ("wordlist" in response) {
      expect(response.wordlist).toEqual(expectedInflections);
    }
  });
});
