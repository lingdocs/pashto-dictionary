/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { saveOptions, readOptions, optionsLocalStorageName } from "./local-storage";
import {
    defaultTextOptions,
} from "@lingdocs/pashto-inflector";

const optionsStub: Options = {
    language: "Pashto",
    searchType: "fuzzy",
    theme: "dark",
    textOptions: defaultTextOptions,
    wordlistMode: "browse",
    wordlistReviewLanguage: "Pashto",
    wordlistReviewBadge: true,
    searchBarPosition: "top",
};

test("saveOptions should work", () => {
    localStorage.clear();
    saveOptions(optionsStub);
    expect(JSON.parse(
        localStorage.getItem(optionsLocalStorageName)
    )).toEqual(optionsStub);
});

test("readOptions should work", () => {
    localStorage.clear();
    expect(readOptions()).toBe(undefined);
    saveOptions(optionsStub);
    expect(readOptions()).toEqual(optionsStub);
});

test("options should save and be read", () => {
    localStorage.clear();
    expect(readOptions()).toBe(undefined);
    saveOptions(optionsStub);
    expect(readOptions()).toEqual(optionsStub);
    localStorage.setItem(optionsLocalStorageName, "<<BAD JSON>>>");
    expect(readOptions()).toBe(undefined);
});
