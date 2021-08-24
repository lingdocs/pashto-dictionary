import * as functions from "firebase-functions";
import * as FT from "../../website/src/lib/functions-types";
import auth from "./middleware/lingdocs-auth";
import publish from "./publish";

export const publishDictionary = functions.https.onRequest(
    auth((req, res: functions.Response<FT.PublishDictionaryResponse | FT.FunctionError>) => {
        if (req.user.level !== "editor") {
            res.status(403).send({ ok: false, error: "403 forbidden" });
            return;
        }
        publish().then(res.send);
    })
);

export const willError = functions.https.onRequest((req, res) => {
    auth((req, res: functions.Response<FT.PublishDictionaryResponse | FT.FunctionError>) => {
        throw new Error("this is an error");
    })
})
    
// TODO: BETTER HANDLING OF EXPRESS MIDDLEWARE

export const submissions = functions
    .region("europe-west1")
    .runWith({
        timeoutSeconds: 30,
        memory: "1GB"
    })
    .https.onRequest((req, res) => {
        res.send({ ok: false, error: "function under maintenance" });
        // return cors({ origin: true })(req, res, () => {
        //     validateFirebaseIdToken(req, res, async () => {
        //         if (!Array.isArray(req.body)) {
        //             res.status(400).send({
        //                 ok: false,
        //                 error: "invalid submission",
        //             });
        //             return;
        //         }
        //         const suggestions = req.body as BT.SubmissionsRequest;
        //         // @ts-ignore
        //         const uid = req.user.uid as string;
        //         const editor = await isEditor(req);
        //         try {
        //             const response = await receiveSubmissions(suggestions, editor);
        //             // TODO: WARN IF ANY OF THE EDITS DIDN'T HAPPEN
        //             res.send(response);
        //             return;
        //         } catch (error) {
        //             console.error(error);
        //             return res.status(500).send({
        //                 error: error.toString(),
        //             });
        //         };
        //     }).catch(console.error);
    });
