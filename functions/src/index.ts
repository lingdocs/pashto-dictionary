import * as functions from "firebase-functions";
import fetch from "node-fetch";
import cors from "cors";
// import publish from "./publish";
// import * as BT from "../../website/src/lib/backend-types"

export const testme = functions
    // .runWith({
    //     timeoutSeconds: 200,
    //     memory: "2GB"
    // })
    .https.onRequest((req, res) => {
        return cors({ credentials: true, origin: /\.lingdocs\.com$/ })(req, res, () => {
            const { headers: { cookie }} = req;
            if (!cookie) {
                return res.status(401).send({ ok: false, error: "unauthorized" });
            }
            fetch("https://account.lingdocs.com/api/user", {
                headers: { cookie },
            }).then(r => r.json()).then(r => {
                res.send({ ok: true, r });
            }).catch((error) => res.send({ ok: false, error }));
            return;
        });
});

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
