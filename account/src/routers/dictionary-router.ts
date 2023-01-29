import express from "express";
import {
    allWordsCollection,
    collection,
    findInAllWords,
    getEntries,
    updateDictionary,    
} from "../lib/dictionary";

const dictionaryRouter = express.Router();

dictionaryRouter.post("/update", async (req, res, next) => {
    const result = await updateDictionary();
    res.send({ ok: true, result });
});

dictionaryRouter.post("/all-words", async (req, res, next) => {
    if (!allWordsCollection) {
        return res.send({ ok: false, message: "allWords not ready" });
    }
    const word = req.body.word as string;
    if (!word) {
        return res.status(400).send({ ok: false, error: "invalid query" });
    }
    const results = await findInAllWords(word);
    res.send(results);
})

dictionaryRouter.post("/entries", async (req, res, next) => {
    if (!collection) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    const ids = req.body.ids as (number | string)[];
    if (!Array.isArray(ids)) {
        return res.status(400).send({ ok: false, error: "invalid query" });
    }
    const results = await getEntries(ids);
    return res.send(results);
});

dictionaryRouter.get("/entries/:id", async (req, res, next) => {
    if (!collection) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    const ids = req.params.id.split(",").map(x => {
        const n = parseInt(x);
        return Number.isNaN(n) ? x : n;
    });
    const results = await getEntries(ids);
    return res.send(results);
});

export default dictionaryRouter;