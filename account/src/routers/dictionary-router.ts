import express from "express";
import {
    collection,
    getEntries,
    updateDictionary,    
} from "../lib/dictionary";
import { unary } from "froebel";

const dictionaryRouter = express.Router();

dictionaryRouter.post("/update", async (req, res, next) => {
    const result = await updateDictionary();
    res.send({ ok: true, result });
});

dictionaryRouter.post("/entries", async (req, res, next) => {
    if (!collection) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    const ids = req.body.ids as number[];
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
    const ids = req.params.id.split(",").map(unary(parseInt));
    const results = await getEntries(ids);
    return res.send(results);
});

export default dictionaryRouter;