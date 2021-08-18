/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    addToAttachmentObject,
    removeAttachmentFromObject,
} from "./wordlist-database";

export function addAudioToWordlistWord(word: WordlistWord, file: File): WordlistWord {
    return {
        ...word,
        _attachments: addToAttachmentObject(
            "_attachments" in word ? word._attachments : {},
            file.name,
            {
                "content_type": file.type,
                data: file,
            },
        ),
    };
}

export function removeAudioFromWordlistWord(word: WordlistWordWAttachments) {
    const attachments = "_attachments" in word
        ? removeAttachmentFromObject(word._attachments, "audio")
        : undefined;
    const { _attachments, ...rest } = word;
    return {
        ...attachments ? {
            _attachments: attachments,
        } : {},
        ...rest
    };
}