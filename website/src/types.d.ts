/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type DictionaryStatus = "loading" | "ready" | "updating" | "error loading";
type Language = "Pashto" | "English";
type SearchType = "alphabetical" | "fuzzy";
type Theme = "light" | "dark";
type PTextSize = "normal" | "larger" | "largest";
type Phonetics = "lingdocs" | "ipa" | "alalc" | "none";
type Dialect = "standard" | "peshawer" | "southern";
type SearchBarPosition = "top" | "bottom";

type WordlistMode = "browse" | "review";

type Options = {
    language: Language,
    searchType: SearchType,
    theme: Theme,
    textOptions: import("@lingdocs/pashto-inflector").Types.TextOptions,
    level: UserLevel,
    wordlistMode: WordlistMode,
    wordlistReviewLanguage: Language,
    wordlistReviewBadge: boolean,
    searchBarPosition: SearchBarPosition,
}

type UserLevel = "basic" | "student" | "editor";

type State = {
    dictionaryStatus: DictionaryStatus,
    searchValue: string,
    options: Options,
    page: number,
    isolatedEntry: import("@lingdocs/pashto-inflector").Types.DictionaryEntry | undefined,
    results: import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
    wordlist: WordlistWord[],
    reviewTasks: import("./lib/backend-types").ReviewTask[],
    dictionaryInfo: import("@lingdocs/pashto-inflector").Types.DictionaryInfo | undefined,
}

type OptionsAction = {
    type: "toggleSearchType",
} | {
    type: "toggleLanguage",
} | {
    type: "changePTextSize",
    payload: PTextSize,
} | {
    type: "changeTheme",
    payload: Theme,
} | {
    type: "changeSearchBarPosition",
    payload: SearchBarPosition,
} | {
    type: "changeSpelling",
    payload: import("@lingdocs/pashto-inflector").Types.Spelling,
} | {
    type: "changePhonetics",
    payload: import("@lingdocs/pashto-inflector").Types.Phonetics,
} | {
    type: "changeDialect",
    payload: import("@lingdocs/pashto-inflector").Types.Dialect,
} | {
    type: "changeDiacritics",
    payload: boolean,
} | {
    type: "changeUserLevel",
    payload: UserLevel,
} | {
    type: "changeWordlistMode",
    payload: WordlistMode,
} | {
    type: "changeWordlistReviewLanguage",
    payload: Language,
} | {
    type: "changeWordlistReviewBadge",
    payload: boolean,
};

type DictionaryAPI = {
    initialize: () => Promise<{
        response: "loaded first time" | "loaded from saved",
        dictionaryInfo: import("@lingdocs/pashto-inflector").Types.DictionaryInfo,
    }>,
    update: (updateComing: () => void) => Promise<{
        response: "no need for update" | "updated" | "unable to check",
        dictionaryInfo: import("@lingdocs/pashto-inflector").Types.DictionaryInfo,
    }>,
    search: (state: State) => import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
    exactPashtoSearch: (search: string) => import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
    getNewWordsThisMonth: () => import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
    findOneByTs: (ts: number) => import("@lingdocs/pashto-inflector").Types.DictionaryEntry | undefined,
    findRelatedEntries: (entry: import("@lingdocs/pashto-inflector").Types.DictionaryEntry) => import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
}

type AttachmentToPut = {
    content_type: string,
    data: string | blob,
}

type AttachmentWithData = {
    content_type: string,
    digest: string,
    data: string | blob,
}

type AttachmentWOutData = {
    content_type: string,
    digest: string,
    stub: true;
}

type Attachment = AttachmentToPut | AttachmentWithData | AttachmentWOutData
type AttachmentType = "image" | "audio";
type Attachments = {
    /* only allows one image and one audio attachment - max 2 values */
    [filename: string]: Attachment,
};

type WordlistWordBase = {
    _id: string,
    /* a backup copy of the full dictionary entry in case it gets deleted from the dictionary */
    entry: T.DictionaryEntry,
    /* the notes/context provided by the user for the word in their wordlist */
    notes: string,
    supermemo: import("supermemo").SuperMemoItem,
    /* rep/stage of warmup stage before moving into supermemo mode */
    warmup: number | "done",
    /* date due for review - ISO string */
    dueDate: number,
}

type WordlistAttachmentInfo = {
    imgSize?: { height: number, width: number },
    _attachments: Attachments,
}

type WordlistWordWAttachments = WordlistWordBase & WordlistAttachmentInfo;

type WordlistWord = WordlistWordBase | WordlistWordWAttachments;

type WordlistWordDoc = WordlistWord & { _rev: string, _id: string };

type InflectionName = "plain" | "1st" | "2nd";

type InflectionSearchResult = {
    form: string[],
    matches: {
        ps: T.PsString,
        pos: InflectionName[] | import("@lingdocs/pashto-inflector").Types.Person[] | null,
    }[],
};
