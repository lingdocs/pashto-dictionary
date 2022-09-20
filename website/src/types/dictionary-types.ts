export type DictionaryStatus = "loading" | "ready" | "updating" | "error loading";

export type State = {
    dictionaryStatus: DictionaryStatus,
    searchValue: string,
    options: Options,
    page: number,
    isolatedEntry: import("@lingdocs/pashto-inflector").Types.DictionaryEntry | undefined,
    results: import("@lingdocs/pashto-inflector").Types.DictionaryEntry[],
    wordlist: WordlistWord[],
    reviewTasks: import("./functions-types").ReviewTask[],
    dictionaryInfo: import("@lingdocs/pashto-inflector").Types.DictionaryInfo | undefined,
    user: undefined | import("./account-types").LingdocsUser,
}

export type DictionaryAPI = {
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

export type WordlistWordBase = {
    _id: string,
    /* a backup copy of the full dictionary entry in case it gets deleted from the dictionary */
    entry: import("@lingdocs/pashto-inflector").Types.DictionaryEntry,
    /* the notes/context provided by the user for the word in their wordlist */
    notes: string,
    supermemo: import("supermemo").SuperMemoItem,
    /* rep/stage of warmup stage before moving into supermemo mode */
    warmup: number | "done",
    /* date due for review - ISO string */
    dueDate: number,
}

export type WordlistAttachmentInfo = {
    imgSize?: { height: number, width: number },
    _attachments: Attachments,
}

export type WordlistWordWAttachments = WordlistWordBase & WordlistAttachmentInfo;

export type WordlistWord = WordlistWordBase | WordlistWordWAttachments;

export type Options = {
    language: Language,
    searchType: SearchType,
    theme: Theme,
    textOptionsRecord: TextOptionsRecord,
    wordlistMode: WordlistMode,
    wordlistReviewLanguage: Language,
    wordlistReviewBadge: boolean,
    searchBarPosition: SearchBarPosition,
    searchBarStickyFocus: boolean,
}

export type Language = "Pashto" | "English";
export type SearchType = "alphabetical" | "fuzzy";
export type Theme = "light" | "dark";
export type PTextSize = "normal" | "larger" | "largest";
export type Phonetics = "lingdocs" | "ipa" | "alalc" | "none";
export type Dialect = "standard" | "peshawer" | "southern";
export type SearchBarPosition = "top" | "bottom";

export type WordlistMode = "browse" | "review";

export type TextOptionsRecord = {
    lastModified: import("./account-types").TimeStamp,
    textOptions: import("@lingdocs/pashto-inflector").Types.TextOptions,
};

export type UserLevel = "basic" | "student" | "editor";

export type OptionsAction = {
    type: "toggleSearchType",
} | {
    type: "toggleLanguage",
} | {
    type: "changeTheme",
    payload: Theme,
} | {
    type: "changeSearchBarPosition",
    payload: SearchBarPosition,
} | {
    type: "changeWordlistMode",
    payload: WordlistMode,
} | {
    type: "changeWordlistReviewLanguage",
    payload: Language,
} | {
    type: "changeWordlistReviewBadge",
    payload: boolean,
} | {
    type: "updateTextOptionsRecord",
    payload: TextOptionsRecord,
} | {
    type: "changeSearchBarStickyFocus",
    payload: boolean,
}

export type TextOptionsAction = {
    type: "changePTextSize",
    payload: PTextSize,
} | {
    type: "changeSpelling",
    payload: import("@lingdocs/pashto-inflector").Types.Spelling,
} | {
    type: "changePhonetics",
    payload: "lingdocs" | "ipa" | "alalc" | "none",
} | {
    type: "changeDialect",
    payload: "standard" | "peshawer" | "southern",
} | {
    type: "changeDiacritics",
    payload: boolean,
};

export type AttachmentToPut = {
    content_type: string,
    data: string | Blob,
}

export type AttachmentWithData = {
    content_type: string,
    digest: string,
    data: string | Blob,
}

export type AttachmentWOutData = {
    content_type: string,
    digest: string,
    stub: true;
}

export type Attachment = AttachmentToPut | AttachmentWithData | AttachmentWOutData
export type AttachmentType = "image" | "audio";
export type Attachments = {
    /* only allows one image and one audio attachment - max 2 values */
    [filename: string]: Attachment,
};

export type WordlistWordDoc = WordlistWord & { _rev: string, _id: string };

export type InflectionName = "plain" | "1st" | "2nd";

export type PluralInflectionName = "plural" | "2nd";

export type InflectionSearchResult = {
    form: string[],
    matches: {
        ps: import("@lingdocs/pashto-inflector").Types.PsString,
        pos: InflectionName[] | import("@lingdocs/pashto-inflector").Types.Person[] | null,
    }[],
};

