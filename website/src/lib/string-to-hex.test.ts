import stringToHex from "./string-to-hex";

test("stringToHex should work", () => {
    expect(stringToHex("apple")).toEqual("6170706c65");
    expect(stringToHex("a much longer string here I am writing")).toEqual("61206d756368206c6f6e67657220737472696e672068657265204920616d2077726974696e67");
});