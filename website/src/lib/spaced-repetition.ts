/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    supermemo,
    SuperMemoGrade,
    SuperMemoItem,
} from "supermemo";
import dayjs from "dayjs";
import {
    getMillisecondsPeriod,
} from "./time-utils";
import {
    WordlistWord,
} from "../types/dictionary-types";

/* starting stage of review, based on Pimseleur intervals */
const warmupIntervals = [
    0,
    getMillisecondsPeriod("minutes", 10),
    getMillisecondsPeriod("hours", 2),
];
const oneDay = getMillisecondsPeriod("hours", 24);

export const baseSupermemo: SuperMemoItem = {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
}

/**
 * given a wordlist, it returns the words that are ready for review,
 * sorted with the most overdue words first
 * 
 * @param wordlist 
 * @returns 
 */
export function forReview(wordlist: WordlistWord[]): WordlistWord[] {
    const now = Date.now();

    return wordlist.filter((word) => (
        // filter out just the words that are due for repetition
        now > word.dueDate
    )).sort((a, b) => (a.dueDate < b.dueDate) ? -1 : 1);
}

/**
 * give a wordlist, it returns the word that has the lowest due date
 * 
 * @param wordlist 
 * @returns 
 */
export function nextUpForReview(wordlist: WordlistWord[]): WordlistWord {
    return wordlist.reduce((mostOverdue, w): WordlistWord => (
        (mostOverdue.dueDate > w.dueDate) ? w : mostOverdue
    ), wordlist[0]);
}

export function practiceWord(word: WordlistWord, grade: SuperMemoGrade): WordlistWord {
    function handleWarmupRep(): WordlistWord {
        const stage = word.warmup as number;
        const now = Date.now();
        const newLevel = Math.max(0, stage + (
            grade === 5 ? 2
            : grade === 4 ? 1
            : grade === 3 ? 0
            : -1
        ));
        const successAfterOneDay = (grade > 3) && ((now - word.dueDate) > oneDay);
        const warmup = ((newLevel >= warmupIntervals.length) || successAfterOneDay)
            ? "done"
            : newLevel;
        const dueDate = now + (
            warmup === "done" ? getMillisecondsPeriod("hours", 16) : warmupIntervals[newLevel]
        );
        return {
            ...word,
            warmup,
            dueDate,
        };
    }     
    function handleSupermemoRep(): WordlistWord {
        const newSupermemo = supermemo(word.supermemo, grade);
        const dueDate = dayjs(Date.now()).add(newSupermemo.interval, "day").valueOf();
        return {
            ...word,
            supermemo: newSupermemo,
            dueDate,
        };
    }

    if (word.warmup !== "done") {
        return handleWarmupRep();
    }
    return handleSupermemoRep();
}
