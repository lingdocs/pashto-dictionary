import getWordId from "./get-word-id";

test("getWordId should work", () => {
    expect(getWordId("?id=12345")).toBe(12345);
    expect(getWordId("?page=settings&id=12345")).toBe(12345);
    expect(getWordId("")).toBeNull();
    expect(getWordId("?page=home")).toBe(null);
});