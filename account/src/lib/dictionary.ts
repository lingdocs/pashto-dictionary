import loki, { Collection, LokiMemoryAdapter } from "lokijs";
import fetch from "node-fetch";
import { CronJob } from "cron";
const collectionName = "ps-dictionary";
import {
    readDictionary,
    readDictionaryInfo,
    Types as T,
    typePredicates as tp,
} from "@lingdocs/inflect"

export let collection: Collection<any> | undefined = undefined;
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
    const res = await fetch(process.env.LINGDOCS_DICTIONARY_URL || "");
    const buffer = await res.arrayBuffer();
    return readDictionary(buffer as Uint8Array);
}

async function fetchDictionaryInfo(): Promise<T.DictionaryInfo> {
    const res = await fetch(process.env.LINGDOCS_DICTIONARY_URL + "-info" || "");
    const buffer = await res.arrayBuffer();
    return readDictionaryInfo(buffer as Uint8Array);
}

export async function updateDictionary(): Promise<"no update" | "updated"> {
    const info = await fetchDictionaryInfo();
    if (info.release === version) {
        return "no update";
    }
    const dictionary = await fetchDictionary();
    version = dictionary.info.release;
    collection?.clear();
    lokidb.removeCollection(collectionName);
    collection?.insert(dictionary.entries);
    return "updated";
}

function getOneByTs(ts: number): T.DictionaryEntry {
    if (!collection) {
        throw new Error("dictionary not initialized");
    }
    const r = collection.by("ts", ts);
    const { $loki, meta, ...entry } = r;
    return entry;
}

export async function getEntries(ids: number[]): Promise<{
    results: (T.DictionaryEntry | T.VerbEntry)[],
    notFound: number[],
}> {
    if (!collection) {
        throw new Error("dictionary not initialized");
    }
    const results: (T.DictionaryEntry | T.VerbEntry)[] = collection.find({
        "ts": { "$in": ids },
    }).map(x => {
        const { $loki, meta, ...entry } = x;
        return entry;
    }).map((entry): T.DictionaryEntry | T.VerbEntry => {
        if (tp.isVerbDictionaryEntry(entry)) {
            if (entry.c?.includes("comp.") && entry.l) {
                const complement = getOneByTs(entry.l);
                if (!complement) throw new Error("Error getting complement "+entry.l);
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
        notFound: ids.filter(id => !results.find(x => (
            "entry" in x ? x.entry.ts === id : x.ts === id
        ))),
    };
}

lokidb.loadDatabase({}, (err: Error) => {
    lokidb.removeCollection(collectionName);
    collection = lokidb.addCollection(collectionName, {
        // TODO: THIS ISN'T WORKING!
        disableMeta: true,
        indices: ["i", "p"],
        unique: ["ts"],
    });
    fetchDictionary().then((dictionary) => {
        version = dictionary.info.release;
        collection?.insert(dictionary.entries);
        updateJob.start();
    }).catch(console.error);
});
