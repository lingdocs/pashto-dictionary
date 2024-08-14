import loki, { Collection, LokiMemoryAdapter } from "lokijs";
import fetch from "node-fetch";
import { CronJob } from "cron";
const collectionName = "ps-dictionary";
const allWordsCollectionName = "all-words";
import {
  Types as T,
  typePredicates as tp,
  entryOfFull,
  standardizePashto,
} from "@lingdocs/inflect";

export let collection: Collection<T.DictionaryEntry> | undefined = undefined;
export let allWordsCollection: Collection<T.PsString> | undefined = undefined;
const adapter = new LokiMemoryAdapter();
const lokidb = new loki("", {
  adapter,
  autoload: false,
  autosave: false,
  env: "NODEJS",
});

const updateJob = new CronJob("* * * * *", updateDictionary, null, false);

let version: number = 0;

async function fetchDictionary(): Promise<T.Dictionary> {
  const res = await fetch(process.env.LINGDOCS_DICTIONARY_URL + ".json" || "");
  return await res.json();
}

async function fetchAllWords(): Promise<T.AllWordsWithInflections> {
  // TODO: this is really ugly
  const res = await fetch(
    process.env.LINGDOCS_DICTIONARY_URL?.slice(0, -10) +
      "all-words-dictionary.json"
  );
  return await res.json();
}

async function fetchDictionaryInfo(): Promise<T.DictionaryInfo> {
  const res = await fetch(
    process.env.LINGDOCS_DICTIONARY_URL + "-info.json" || ""
  );
  return await res.json();
}

export async function updateDictionary(): Promise<"no update" | "updated"> {
  try {
    const info = await fetchDictionaryInfo();
    if (info.release === version) {
      return "no update";
    }
    const dictionary = await fetchDictionary();
    version = dictionary.info.release;
    collection?.clear();
    lokidb.removeCollection(collectionName);
    collection?.insert(dictionary.entries);
    const allWords = await fetchAllWords();
    allWordsCollection?.clear();
    lokidb.removeCollection(allWordsCollectionName);
    allWordsCollection?.insert(allWords.words);
    return "updated";
  } catch (e) {
    console.error(e);
    return "no update";
  }
}

function getOneByTs(ts: number): T.DictionaryEntry {
  if (!collection) {
    throw new Error("dictionary not initialized");
  }
  const r = collection.by("ts", ts);
  // @ts-ignore
  const { $loki, meta, ...entry } = r;
  return entry;
}

export function findInAllWords(p: string | RegExp): T.PsWord[] | undefined {
  if (!allWordsCollection) {
    throw new Error("allWords not initialized");
  }
  return allWordsCollection.find({
    p: typeof p === "string" ? p : { $regex: p },
  });
}

export async function getEntries(ids: (number | string)[]): Promise<{
  results: (T.DictionaryEntry | T.VerbEntry)[];
  notFound: (number | string)[];
}> {
  if (!collection) {
    throw new Error("dictionary not initialized");
  }
  const idsP = ids.map((x) =>
    typeof x === "number" ? x : standardizePashto(x)
  );
  const results: (T.DictionaryEntry | T.VerbEntry)[] = collection
    .find({
      $or: [{ ts: { $in: idsP } }, { p: { $in: idsP } }],
    })
    .map((x) => {
      const { $loki, meta, ...entry } = x;
      return entry;
    })
    .map((entry): T.DictionaryEntry | T.VerbEntry => {
      if (tp.isVerbDictionaryEntry(entry)) {
        if (entry.c?.includes("comp.") && entry.l) {
          const complement = getOneByTs(entry.l);
          if (!complement)
            throw new Error("Error getting complement " + entry.l);
          return {
            entry,
            complement,
          };
        }
        return { entry };
      } else {
        return entry;
      }
    });
  return {
    results,
    notFound: ids.filter(
      (id) =>
        !results.find((x) => {
          const entry = entryOfFull(x);
          return entry.p === id || entry.ts === id;
        })
    ),
  };
}

lokidb.loadDatabase({}, (err: Error) => {
  lokidb.removeCollection(collectionName);
  lokidb.removeCollection(allWordsCollectionName);
  fetchDictionary()
    .then((dictionary) => {
      collection = lokidb.addCollection(collectionName, {
        indices: ["i", "p"],
        unique: ["ts"],
      });
      version = dictionary.info.release;
      collection?.insert(dictionary.entries);
      updateJob.start();
    })
    .catch(console.error);
  fetchAllWords().then((allWords) => {
    allWordsCollection = lokidb.addCollection(allWordsCollectionName, {
      indices: ["p"],
    });
    allWordsCollection?.insert(allWords.words);
  });
});
