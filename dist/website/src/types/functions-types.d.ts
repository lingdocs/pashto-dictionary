/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Types as T } from "@lingdocs/pashto-inflector";
import * as AT from "./account-types";
export declare type FunctionResponse = PublishDictionaryResponse | SubmissionsResponse | FunctionError;
export declare type FunctionError = {
    ok: false;
    error: string;
};
export declare type PublishDictionaryResponse = {
    ok: true;
    info: T.DictionaryInfo;
} | {
    ok: false;
    errors: T.DictionaryEntryError[];
};
export declare type Submission = Edit | ReviewTask;
export declare type Edit = EntryEdit | NewEntry | EntryDeletion;
export declare type SubmissionBase = {
    _id: string;
    sTs: number;
    user: {
        userId: AT.UUID;
        name: string;
        email: string;
    };
};
export declare type ReviewTask = Issue | EditSuggestion | EntrySuggestion;
export declare type EntryEdit = SubmissionBase & {
    type: "entry edit";
    entry: T.DictionaryEntry;
};
export declare type EntryDeletion = SubmissionBase & {
    type: "entry deletion";
    ts: number;
};
export declare type NewEntry = SubmissionBase & {
    type: "new entry";
    entry: T.DictionaryEntry;
};
export declare type Issue = SubmissionBase & {
    type: "issue";
    content: string;
};
export declare type EditSuggestion = SubmissionBase & {
    type: "edit suggestion";
    entry: T.DictionaryEntry;
    comment: string;
};
export declare type EntrySuggestion = SubmissionBase & {
    type: "entry suggestion";
    entry: T.DictionaryEntry;
    comment: string;
};
export declare type SubmissionsRequest = Submission[];
export declare type SubmissionsResponse = {
    ok: true;
    message: string;
    submissions: Submission[];
};
