import express from "express";
import {
  allWordsCollection,
  collection,
  getEntries,
  updateDictionary,
} from "../lib/dictionary";
import { scriptToPhonetics } from "../lib/scriptToPhonetics";

const dictionaryRouter = express.Router();

dictionaryRouter.post("/update", async (req, res, next) => {
  const result = await updateDictionary();
  res.send({ ok: true, result });
});

dictionaryRouter.post("/script-to-phonetics", async (req, res, next) => {
  if (!allWordsCollection) {
    return res.send({ ok: false, message: "allWords not ready" });
  }
  const text = req.body.text as unknown;
  const accents = req.body.accents as unknown;
  if (!text || typeof text !== "string" || typeof accents !== "boolean") {
    return res.status(400).send({ ok: false, error: "invalid query" });
  }
  const results = await scriptToPhonetics(text, accents);
  res.send({ ok: true, results });
});

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
  const ids = req.params.id.split(",").map((x) => {
    const n = parseInt(x);
    return Number.isNaN(n) ? x : n;
  });
  const results = await getEntries(ids);
  return res.send(results);
});

export default dictionaryRouter;
