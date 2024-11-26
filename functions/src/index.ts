import * as functions from "firebase-functions/v2";
import * as FT from "../../website/src/types/functions-types";
import { receiveSubmissions } from "./submissions";
import lingdocsAuth from "./middleware/lingdocs-auth";
import publish from "./publish";

const couchdbUrl = functions.params.defineString("ABC");
console.log({ couchdb: couchdbUrl.value() });

export const publishDictionary = functions.https.onRequest(
  {
    timeoutSeconds: 525,
    memory: "2GiB",
  },
  lingdocsAuth(
    async (
      req,
      res // : functions.Response<FT.PublishDictionaryResponse | FT.FunctionError>
    ) => {
      if (req.user.level !== "editor") {
        res.status(403).send({ ok: false, error: "403 forbidden" });
        return;
      }
      try {
        const response = await publish();
        res.send(response);
      } catch (e) {
        // @ts-ignore
        res.status(500).send({ ok: false, error: e.message });
      }
    }
  )
);

export const submissions = functions.https.onRequest(
  {
    timeoutSeconds: 60,
    memory: "1GiB",
  },
  lingdocsAuth(
    async (
      req,
      res // : functions.Response<FT.SubmissionsResponse | FT.FunctionError>
    ) => {
      if (!Array.isArray(req.body)) {
        res.status(400).send({
          ok: false,
          error: "invalid submission",
        });
        return;
      }
      const suggestions = req.body as FT.SubmissionsRequest;
      try {
        const response = await receiveSubmissions(suggestions, true); // req.user.level === "editor");
        // TODO: WARN IF ANY OF THE EDITS DIDN'T HAPPEN
        res.send(response);
      } catch (e) {
        // @ts-ignore
        res.status(500).send({ ok: false, error: e.message });
      }
    }
  )
);
