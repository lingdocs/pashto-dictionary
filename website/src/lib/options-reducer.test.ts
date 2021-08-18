import optionsReducer from "./options-reducer";
import { defaultTextOptions } from "@lingdocs/pashto-inflector";

const options: Options = {
    textOptions: defaultTextOptions,
    language: "Pashto",
    searchType: "fuzzy",
    theme: "light",
    level: "basic",
    wordlistMode: "browse",
    wordlistReviewLanguage: "Pashto",
    wordlistReviewBadge: true,
    searchBarPosition: "top",
};

test("options reducer should work", () => {
    expect(optionsReducer(options, { type: "toggleLanguage" }))
        .toEqual({
            ...options,
            language: "English",
        });
    expect(optionsReducer({ ...options, language: "English" }, { type: "toggleLanguage" }))
        .toEqual(options);
    expect(optionsReducer(options, { type: "toggleSearchType" }))
        .toEqual({
            ...options,
            searchType: "alphabetical",
        });
    expect(optionsReducer({ ...options, searchType: "alphabetical" }, { type: "toggleSearchType" }))
        .toEqual(options);
    expect(optionsReducer(options, { type: "changeTheme", payload: "dark" }))
        .toEqual({
            ...options,
            theme: "dark",
        });
    expect(optionsReducer(options, { type: "changeUserLevel", payload: "student" }))
        .toEqual({
            ...options,
            level: "student",
        });
    expect(optionsReducer(options, { type: "changeWordlistMode", payload: "review" }))
        .toEqual({
            ...options,
            wordlistMode: "review",
        });
    expect(optionsReducer(options, { type: "changeWordlistReviewLanguage", payload: "English" }))
        .toEqual({
            ...options,
            wordlistReviewLanguage: "English",
        });
    expect(optionsReducer(options, { type: "changeWordlistReviewBadge", payload: false }))
        .toEqual({
            ...options,
            wordlistReviewBadge: false,
        });
    expect(optionsReducer(options, { type: "changeSearchBarPosition", payload: "bottom" }))
        .toEqual({
            ...options,
            searchBarPosition: "bottom",
        });
    expect(optionsReducer(options, { type: "changePTextSize", payload: "largest" }))
        .toEqual({
            ...options,
            textOptions: {
                ...defaultTextOptions,
                pTextSize: "largest",
            },
        });
    expect(optionsReducer(options, { type: "changeSpelling", payload: "Pakistani" }))
        .toEqual({
            ...options,
            textOptions: {
                ...defaultTextOptions,
                spelling: "Pakistani",
            },
        });
    expect(optionsReducer(options, { type: "changePhonetics", payload: "ipa" }))
        .toEqual({
            ...options,
            textOptions: {
                ...defaultTextOptions,
                phonetics: "ipa",
            },
        });
    expect(optionsReducer(options, { type: "changeDialect", payload: "southern" }))
        .toEqual({
            ...options,
            textOptions: {
                ...defaultTextOptions,
                dialect: "southern",
            },
        });
    expect(optionsReducer(options, { type: "changeDiacritics", payload: true }))
        .toEqual({
            ...options,
            textOptions: {
                ...defaultTextOptions,
                diacritics: true,
            },
        });
    expect(() => {
        // @ts-ignore
        optionsReducer(options, { type: "non existent action" });
    }).toThrow("action type not recognized in reducer");
})