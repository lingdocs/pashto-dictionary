import cors from "cors";
import fetch from "node-fetch";
import type { https, Response } from "firebase-functions";
import * as FT from "../../../website/src/types/functions-types";
import type { LingdocsUser } from "../../../website/src/types/account-types";

const useCors = cors({ credentials: true, origin: /\.lingdocs\.com$/ });

interface ReqWUser extends https.Request {
    user: LingdocsUser;
}

/**
 * creates a handler to pass to a firebase https.onRequest function 
 *
 */
export default function makeHandler(toRun: (req: ReqWUser, res: Response<FT.FunctionResponse>) => any | Promise<any>) {
    return function(reqPlain: https.Request, resPlain: Response<any>) {
        useCors(reqPlain, resPlain, async () => {
            const { req, res } = await authorize(reqPlain, resPlain);
            if (!req) {
                res.status(401).send({ ok: false, error: "unauthorized" });
                return;
            };
            toRun(req, res);
            return;
        });
    }
}

async function authorize(req: https.Request, res: Response<any>): Promise<{ req: ReqWUser | null, res: Response<FT.FunctionResponse> }> {
    const { headers: { cookie }} = req;
    if (!cookie) {
        return { req: null, res };
    }
    const r = await fetch("https://account.lingdocs.com/api/user", { headers: { cookie }});
    const { ok, user } = await r.json();
    if (ok === true && user) {
        req.user = user;
        return { req: req as ReqWUser, res };
    }
    return { req: null, res };
}