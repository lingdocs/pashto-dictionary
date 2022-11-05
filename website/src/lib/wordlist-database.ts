/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    standardizePashto,
    revertSpelling,
    Types as T,
} from "@lingdocs/ps-react";
import { dictionary } from "./dictionary";
import { baseSupermemo } from "./spaced-repetition";
import {
    addToLocalDb,
    updateLocalDbDoc,
    getAllDocsLocalDb,
    deleteFromLocalDb,
    getAttachment,
} from "./pouch-dbs";
import Papa from "papaparse";
import {
    // getImageSize,
    prepBase64,
} from "./image-tools";
import { getMillisecondsPeriod } from "./time-utils";
import {
    WordlistWord,
    AttachmentType,
    Attachments,
    AttachmentToPut,
} from "../types/dictionary-types";

export async function addToWordlist({ entry, notes }: {
    entry: T.DictionaryEntry,
    notes: string,
}): Promise<WordlistWord> {
    const doc: WordlistWord = {
        _id: new Date().toJSON(),
        warmup: 0,
        supermemo: baseSupermemo,
        dueDate: Date.now(),
        entry,
        notes,
    };
    await addToLocalDb({ type: "wordlist", doc });
    return doc;
}

export async function updateWordlistWord(word: WordlistWord): Promise<WordlistWord> {
    const doc: WordlistWord = {
        ...word,
        entry: dictionary.findOneByTs(word.entry.ts) ?? word.entry,
    }
    await updateLocalDbDoc({ type: "wordlist", doc }, doc._id);
    return doc;
}


export async function getWordlist(limit?: number): Promise<WordlistWord[]> {
    const words = await getAllDocsLocalDb("wordlist", limit);
    const wordlist = words.map((word) => {
        const matchingWord = dictionary.findOneByTs(word.entry.ts);
        return {
            ...word,
            entry: matchingWord ?? word.entry,
        } as WordlistWord;
    });
    // Thing just to fix if anyone added any words before we were adding the image size thing
    // for (let i = 0; i < wordlist.length; i++) {
    //     const w = wordlist[i];
    //     if ("_attachments" in w && hasImage(w._attachments) && !("imageSize" in w)) {
    //         const imgSize = await getImageSize(await getImageAttachment(w as WordlistWordWAttachments));
    //         wordlist[i].imgSize = imgSize;
    //     }
    // }
    return wordlist;
}

export async function getWordlistCsv(sortType: "alphabetical" | "time"): Promise<Blob> {
    const words = await getWordlist();
    const forCsv = words.map((w) => (
        [w.entry.p, w.entry.f, w.entry.c, w.entry.e, w.entry.ts]
    ));
    if (sortType === "alphabetical") {
        // @ts-ignore
        forCsv.sort((a, b) => a[0].localeCompare(b[0], "ps"));
    }
    const csv = Papa.unparse(forCsv);
    return new Blob(["\ufeff", csv], {type : "text/csv;charset=utf-8"});
}

export async function deleteWordFromWordlist(id: string | string[]): Promise<void> {
    await deleteFromLocalDb("wordlist", id);
}

function getWordlistAttachment(docId: string, attachmentId: string, binary: "binary"): Promise<Blob | Buffer>;
function getWordlistAttachment(docId: string, attachmentId: string): Promise<string>;
function getWordlistAttachment(docId: string, attachmentId: string, binary?: "binary"): Promise<string | Buffer | Blob> {
    return new Promise((resolve) => {
        getAttachment("wordlist", docId, attachmentId).then((blob) => {
            if (binary) {
                resolve(blob);
            }
            var reader = new FileReader();
            reader.readAsDataURL(blob as Blob); 
            reader.onloadend = function() {
                const base64data = reader.result as string;
                resolve(base64data.substr(base64data.indexOf(',')+1));
            }
        });
    });
}

/**
 * If asking for an image and there image attached in a given WordlistWord, it returns it as a base64 string prepped
 * to be used as the src of an <img>. Otherwise returns undefined
 * 
 * @param word 
 * @returns 
 */
export async function getImageAttachment(word: WordlistWord): Promise<string | undefined> {
    // TODO: make this getting the image attachment only
    // RETURN undefined if none
    if (!("_attachments" in word)) {
        return undefined;
    }
    const key = Object.keys(word._attachments)
        .find((key) => word._attachments[key].content_type.includes("image"));
    if (!key) {
        return undefined;
    }
    const contentType = word._attachments[key].content_type;
    const data = await getWordlistAttachment(word._id, key);
    return prepBase64(contentType, data);
}

export async function getAudioAttachment(word: WordlistWord): Promise<Blob | Buffer | undefined> {
    if (!("_attachments" in word)) {
        return undefined;
    }
    const key = Object.keys(word._attachments)
        .find((key) => word._attachments[key].content_type.includes("audio"));
    if (!key) {
        return undefined;
    }
    return await getWordlistAttachment(word._id, key, "binary");
}

export function searchWordlist(search: string, wordlist: WordlistWord[], textOptions: T.TextOptions): WordlistWord[] {
    // TODO: IS this the right order?
    const standardized = standardizePashto(search);
    const s = revertSpelling(standardized, textOptions.spelling);
    return wordlist.filter((word) => (
        word.entry.e.includes(s) ||
        word.entry.p.includes(s) ||
        word.entry.g?.includes(s) ||
        word.notes?.includes(s) ||
        word.notes?.includes(search)
    ));
}

export function calculateWordsToDelete(wordlist: WordlistWord[], monthsBackToKeep: number): string[] {
    if (monthsBackToKeep === 0) {
        return [...wordlist].map((word) => word._id);
    }
    const now = Date.now();
    const cutoffDate = now - getMillisecondsPeriod("months", monthsBackToKeep);
    return wordlist.filter((word) => {
        const timestamp = Date.parse(word._id);
        return timestamp < cutoffDate; 
    }).map((word) => word._id);
}

/**
 * returns a new Attachments object for adding to or updating a PouchDB document 
 * only allows one image attachment and one audio attachment in the object
 * 
 * @param attachments 
 * @param attachment 
 * @returns 
 */
export function addToAttachmentObject(attachments: Attachments, name: string, attachment: AttachmentToPut): Attachments {
    const type: AttachmentType | null = attachment.content_type.includes("audio")
        ? "audio"
        : attachment.content_type.includes("image")
        ? "image"
        : null;
    if (!type) {
        console.error("tried to add a non image/audio file to the attachments object - not accepted");
        return attachments;
    }
    const keyToKeep = Object.keys(attachments).filter((key) => !attachments[key].content_type.includes(type))[0];
    // there can only be zero or one key left, because there can only be one image and one audio file
    return {
        ...keyToKeep ? {
            [keyToKeep]: attachments[keyToKeep],
        } : {},
        [name]: attachment,
    };
}

/**
 * Removes an attachment of a given type from an Attachments object of a PouchDB document
 * 
 * @param attachments 
 * @param type 
 */
export function removeAttachmentFromObject(attachments: Attachments, type: AttachmentType): Attachments | undefined {
    const keyToKeep = Object.keys(attachments).filter((key) => !attachments[key].content_type.includes(type))[0];
    if (keyToKeep) {
        return {
            keyToKeep: attachments[keyToKeep],
        };
    }
    return undefined;
}

export function hasAttachment(word: WordlistWord, type: AttachmentType): boolean {
    if (!("_attachments" in word)) {
        return false;
    }
    const attachments = word._attachments;
    return Object.keys(attachments).some((key) => attachments[key].content_type.includes(type));      
} 