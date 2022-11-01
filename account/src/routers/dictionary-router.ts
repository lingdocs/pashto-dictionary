import express, { Response } from "express";
import {
    collection,
    dictionary,
    updateDictionary,    
} from "../lib/dictionary";
import { unary } from "froebel";

const dictionaryRouter = express.Router();

// Guard all api with authentication
dictionaryRouter.get("/", async (req, res, next) => {
    if (!dictionary) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    res.send(dictionary);
})

dictionaryRouter.get("/info", async (req, res, next) => {
    if (!dictionary) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    res.send({ info: dictionary.info })
});

dictionaryRouter.post("/update", async (req, res, next) => {
    updateDictionary();
    res.send({ ok: true });
});

dictionaryRouter.get("/entry/:id", async (req, res, next) => {
    const id = req.params.id.includes(",")
        ? req.params.id.split(",").map(unary(parseInt))
        : parseInt(req.params.id);
    if (!collection) {
        return res.send({ ok: false, message: "dictionary not ready" });
    }
    if (Array.isArray(id)) {
        const results = collection.find({
            "ts": {
                "$in": id,
            },
        });
        return res.send({ results });
    }
    const r = collection.by("ts", id);
    if (!r) {
        return res.send({ result: [] });
    }
    // remove $loki and meta
    const { $loki, meta, ...word } = r;
    return res.send({ result: word });
});

export default dictionaryRouter;