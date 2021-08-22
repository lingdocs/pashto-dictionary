import * as FT from "./functions-types";
import * as AT from "./account-types";

// const functionsBaseUrl = // process.env.NODE_ENV === "development"
//     // "http://127.0.0.1:5001/lingdocs/europe-west1/"
//     "https://europe-west1-lingdocs.cloudfunctions.net/";

const accountBaseUrl = "https://account.lingdocs.com/api/";

// TODO: TYPE BODY
async function accountApiFetch(url: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any): Promise<AT.APIResponse> {
    const response = await fetch(accountBaseUrl + url, {
        method,
        credentials: "include",
        ...body ? {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        } : {},
    });
    return await response.json() as AT.APIResponse;
}

export async function publishDictionary(): Promise<FT.PublishDictionaryResponse> {
    return {
        ok: true,
        // @ts-ignore
        info: {},
    };
}

export async function upgradeAccount(password: string): Promise<AT.UpgradeUserResponse> {

    const response = await accountApiFetch("user/upgrade", "PUT", { password });
    return response as AT.UpgradeUserResponse;
}

export async function postSubmissions(submissions: FT.SubmissionsRequest): Promise<FT.SubmissionsResponse> {
    // return await tokenFetch("submissions", "POST", submissions) as FT.SubmissionsResponse;
    return {
        ok: true,
        message: "received",
        submissions: [],
    }
}

export async function getUser(): Promise<undefined | AT.LingdocsUser | "offline"> {
    try {
        const response = await accountApiFetch("user"); 
        if ("user" in response) {
            return response.user;
        }
        return undefined;
    } catch (e) {
        console.error(e);
        return "offline";
    }
}
