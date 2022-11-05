/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Types as T } from "@lingdocs/ps-react";
import * as AT from "./account-types";

export type FunctionResponse = PublishDictionaryResponse | SubmissionsResponse | FunctionError;

export type FunctionError = { ok: false, error: string };

export type PublishDictionaryResponse = {
    ok: true,
    info: T.DictionaryInfo,
} | {
    ok: false,
    errors: T.DictionaryEntryError[],
};

export type Submission = Edit | ReviewTask;

export type Edit = EntryEdit | NewEntry | EntryDeletion

export type SubmissionBase = {
    _id: string,
    sTs: number,
    user: {
        userId: AT.UUID,
        name: string,
        email: string,
    },
}

export type ReviewTask = Issue | EditSuggestion | EntrySuggestion;

export type EntryEdit = SubmissionBase & {
    type: "entry edit",
    entry: T.DictionaryEntry,
};

export type EntryDeletion = SubmissionBase & {
    type: "entry deletion",
    ts: number,
}

export type NewEntry = SubmissionBase & {
    type: "new entry",
    entry: T.DictionaryEntry,
};

export type Issue = SubmissionBase & {
    type: "issue",
    content: string,
};

export type EditSuggestion = SubmissionBase & {
    type: "edit suggestion",
    entry: T.DictionaryEntry,
    comment: string,
}

export type EntrySuggestion = SubmissionBase & {
    type: "entry suggestion",
    entry: T.DictionaryEntry,
    comment: string,
}

export type SubmissionsRequest = Submission[];

export type SubmissionsResponse = {
    ok: true,
    message: string,
    submissions: Submission[],
};
