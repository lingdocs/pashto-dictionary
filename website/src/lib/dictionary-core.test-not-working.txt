import { DictionaryDb } from "./dictionary-core";
import fetchMock from "jest-fetch-mock";
import {
    writeDictionary,
    writeDictionaryInfo,
    Types as T,
} from "@lingdocs/pashto-inflector"

// tslint:disable-next-line
require("fake-indexeddb/auto");
// tslint:disable-next-line
const FDBFactory = require("fake-indexeddb/lib/FDBFactory");

fetchMock.enableMocks();
beforeAll(() => {
    indexedDB = new FDBFactory;
});
afterEach(() => {
    jest.clearAllMocks();
});

const dictInfo: T.DictionaryInfo = {
    title: "testing dictionary",
    license: "none",
    url: "https://www.test.com/dict",
    infoUrl: "https://www.test.com/dictInfo",
    release: 1,
    numberOfEntries: 3,
};

const dictionary: T.Dictionary = {
    info: dictInfo,
    entries: [
        {"i":0,"ts":1575073756109,"p":"آب","f":"aab","g":"aab","e":"water (Farsi - poetic); luster, brilliance; honor, respect, dignity, reputation","c":"n. m."},
        {"i":1,"ts":1527818508,"p":"آب انبار","f":"aabambaar","g":"aabambaar","e":"reservoir, pool (of water)","c":"n. m."},
        {"i":2,"ts":1527820284,"p":"آب باز","f":"aabbáaz","g":"aabbaaz","e":"swimmer","c":"n. m."},
    ],
}

function makeFakeDictServer(release: 1 | 2 | 3 | "offline") {
    if (release === "offline") {
        return function() {
            return Promise.reject(new Error("connection error"))
        };
    }
    const info: T.DictionaryInfo = { ...dictInfo, release };
    const dict: T.Dictionary = { ...dictionary, info };
    const dictInfoBuffer = writeDictionaryInfo(info);
    const dictBuffer = writeDictionary(dict);
    return function fakeDictServer(url: string) {
        if (url === "http://test.com/info.json") {
            return Promise.resolve({ arrayBuffer: () => Promise.resolve(dictInfoBuffer) });
        }
        if (url === "http://test.com/dict.json") {
            return Promise.resolve({ arrayBuffer: () => Promise.resolve(dictBuffer) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ message: "404 not found "})});
    }
}


test("should fail to initialize w/out internet connection", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer("offline"));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    let errored = false;
    try {
        await myDict.initialize();
    } catch (e) {
        errored = true;
    }
    expect(errored).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
});

test("should initialize ok", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer(1));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    const res = await myDict.initialize();
    expect(res.response).toBe("loaded first time");
    expect(fetch).toHaveBeenCalledTimes(1);
});

test("should load the existing dictionary if one has already been loaded", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer(1));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    const res = await myDict.initialize();
    expect(res.response).toBe("loaded from saved");
});

test("should use the saved dictionary if offline", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer("offline"));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    const res = await myDict.initialize();
    expect(res.response).toBe("loaded from saved");
});

test("shouldn't update if there's no need to", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer(1));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    await myDict.initialize();
    const res = await myDict.updateDictionary(() => null);
    expect(res.response).toBe("no need for update");
});

test("should update if there's a new dictionary available and the update notification function should be called", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer(2));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    await myDict.initialize();
    const updateNotificationFunction = jest.fn();
    const res = await myDict.updateDictionary(updateNotificationFunction);
    expect(updateNotificationFunction).toBeCalledTimes(1);
    expect(res.response).toBe("updated");
});

test("should report back if unable to check for a new dictionary and the update notification function should not be called", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer("offline"));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    await myDict.initialize();
    const updateNotificationFunction = jest.fn();
    const res = await myDict.updateDictionary(updateNotificationFunction);
    expect(updateNotificationFunction).toBeCalledTimes(0);
    expect(res.response).toBe("unable to check");
});

test("should update if there's a new dictionary available", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer(3));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    await myDict.initialize();
    const updateNotificationFunction = jest.fn();
    const res = await myDict.updateDictionary(updateNotificationFunction);
    expect(updateNotificationFunction).toBeCalledTimes(1);
    expect(res.response).toBe("updated");
});

test("collection should be accesible after initialization", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer("offline"));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    await myDict.initialize();
    // should work after initialzation
    const oneWord = myDict.collection.by("ts", 1575073756109);
    expect(oneWord).toEqual({
        $loki: 1,
        i: 0,
        ts: 1575073756109,
        p: 'آب',
        f: 'aab',
        g: "aab",
        e: 'water (Farsi - poetic); luster, brilliance; honor, respect, dignity, reputation',
        c: 'n. m.',
    });
});

test("findeOneByTs should work", async () => {
    // @ts-ignore
    fetch.mockImplementation(makeFakeDictServer("offline"));
    const myDict = new DictionaryDb({ 
        url: "http://test.com/dict.json",
        infoUrl: "http://test.com/info.json",
        infoLocalStorageKey: "mykey",
        collectionName: "database",
    });
    // should return undefined if not initialized
    let oneWord = myDict.findOneByTs(1575073756109);
    expect(oneWord).toBeUndefined();
    await myDict.initialize();
    // should work after initialzation
    oneWord = myDict.findOneByTs(1575073756109);
    expect(oneWord).toEqual({
        i: 0,
        ts: 1575073756109,
        p: 'آب',
        f: 'aab',
        g: "aab",
        e: 'water (Farsi - poetic); luster, brilliance; honor, respect, dignity, reputation',
        c: 'n. m.',
    });
    await myDict.updateDictionary(() => null);
    // and after update
    oneWord = myDict.findOneByTs(1575073756109);
    expect(oneWord).toEqual({
        i: 0,
        ts: 1575073756109,
        p: 'آب',
        f: 'aab',
        g: "aab",
        e: 'water (Farsi - poetic); luster, brilliance; honor, respect, dignity, reputation',
        c: 'n. m.',
    });
});
