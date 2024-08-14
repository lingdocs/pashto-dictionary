import { Types as T } from "@lingdocs/ps-react";
import { dictionary } from "../dictionary";
import { baseSupermemo } from "../spaced-repetition";
import { refreshWordlist } from "./pouch-dbs";
import { WordlistWord } from "../../types/dictionary-types";

let wordlistDb: {
  name: string;
  db: WordlistWord[];
} = {
  name: "userdb-local",
  db: [],
};

export async function addToWordlist({
  entry,
  notes,
}: {
  entry: T.DictionaryEntry;
  notes: string;
}): Promise<WordlistWord> {
  const newEntry: WordlistWord = {
    _id: new Date().toJSON(),
    warmup: 0,
    supermemo: baseSupermemo,
    dueDate: Date.now(),
    entry,
    notes,
  };
  wordlistDb = {
    ...wordlistDb,
    db: [...wordlistDb.db, newEntry],
  };
  refreshWordlist();
  return newEntry;
}

export async function updateWordlistWord(
  word: WordlistWord
): Promise<WordlistWord> {
  const index = wordlistDb.db.findIndex((w) => w._id === word._id);
  const old = wordlistDb.db[index];
  const updated = {
    ...old,
    ...word,
    entry: dictionary.findOneByTs(word.entry.ts) || word.entry,
  };
  wordlistDb.db[index] = updated;
  refreshWordlist();
  return updated;
}

export async function getWordlist(_?: number): Promise<WordlistWord[]> {
  return wordlistDb.db;
}

export async function deleteWordFromWordlist(id: string): Promise<void> {
  const index = wordlistDb.db.findIndex((w) => w._id === id);
  wordlistDb.db.splice(index, 1);
  refreshWordlist();
}
