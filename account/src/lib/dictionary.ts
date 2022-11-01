import loki, { Collection, LokiMemoryAdapter } from "lokijs";
import fetch from "node-fetch";
const collectionName = "ps-dictionary";
import {
    readDictionary,
    Types as T,
} from "@lingdocs/inflect"

export let collection: Collection<any> | undefined = undefined;
const adapter = new LokiMemoryAdapter();
const lokidb = new loki("", {
    adapter,
    autoload: false,
    autosave: false,
    env: "NODEJS",
});

export let dictionary: T.Dictionary | undefined = undefined;

// TODO: Abstract dictionary fetch

export function updateDictionary() {
    fetch(process.env.LINGDOCS_DICTIONARY_URL || "").then(res => res.arrayBuffer()).then(buffer => {
        const dict = readDictionary(buffer as Uint8Array);
        dictionary = dict;
        collection?.clear();
        lokidb.removeCollection(collectionName);
        collection?.insert(dictionary.entries);
    }).catch(console.error);
}

lokidb.loadDatabase({}, async (err: Error) => {
    collection = lokidb.getCollection(collectionName);
    if (!collection) {
        collection = lokidb.addCollection(collectionName, {
            // TODO: THIS ISN'T WORKING!
            disableMeta: true,
            indices: ["i", "p"],
            unique: ["ts"],
        });
        fetch(process.env.LINGDOCS_DICTIONARY_URL || "").then(res => res.arrayBuffer()).then(buffer => {
            const dict = readDictionary(buffer as Uint8Array);
            dictionary = dict;
            collection?.insert(dictionary.entries);
        }).catch(console.error);
    }
});
