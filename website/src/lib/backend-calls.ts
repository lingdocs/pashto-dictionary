import { auth } from "./firebase";
import * as BT from "./backend-types";

const functionsBaseUrl = // process.env.NODE_ENV === "development"
    // "http://127.0.0.1:5001/lingdocs/europe-west1/"
    "https://europe-west1-lingdocs.cloudfunctions.net/";


export async function publishDictionary(): Promise<BT.PublishDictionaryResponse> {
    const res = await tokenFetch("publishDictionary");
    if (!res) {
        throw new Error("Connection error/offline");
    }
    return res;
}

export async function upgradeAccount(password: string): Promise<BT.UpgradeUserResponse> {
    const res = await tokenFetch("upgradeUser", "POST", { password });
    if (!res) {
        throw new Error("Connection error/offline");
    }
    return res;
}

export async function postSubmissions(submissions: BT.SubmissionsRequest): Promise<BT.SubmissionsResponse> {
    return await tokenFetch("submissions", "POST", submissions) as BT.SubmissionsResponse;
}

export async function loadUserInfo(): Promise<undefined | BT.CouchDbUser> {
    const res = await tokenFetch("getUserInfo", "GET") as BT.GetUserInfoResponse;
    return "user" in res ? res.user : undefined;
}

// TODO: HARD TYPING OF THIS WITH THE subUrl and return values etc?
async function tokenFetch(subUrl: string, method?: "GET" | "POST", body?: any): Promise<any> {
    if (!auth.currentUser) {
        throw new Error("not signed in");
    }
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${functionsBaseUrl}${subUrl}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            ...body ? {
                body: JSON.stringify(body),
            } : {},
        });
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}
