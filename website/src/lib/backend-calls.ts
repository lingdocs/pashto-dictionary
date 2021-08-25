import * as FT from "./functions-types";
import * as AT from "./account-types";

type Service = "account" | "functions";

const baseUrl: Record<Service, string> = {
    account: "https://account.lingdocs.com/api/",
    functions: "https://functions.lingdocs.com/",
};

// FUNCTIONS CALLS - MUST BE RE-ROUTED THROUGH FIREBASE HOSTING IN ../../../firebase.json
export async function publishDictionary(): Promise<FT.PublishDictionaryResponse | FT.FunctionError> {
    return await myFetch("functions", "publishDictionary") as FT.PublishDictionaryResponse | FT.FunctionError;
}

export async function postSubmissions(submissions: FT.SubmissionsRequest): Promise<FT.SubmissionsResponse> {
    return await myFetch("functions", "submissions", "POST", submissions) as FT.SubmissionsResponse;
}

// ACCOUNT CALLS
export async function upgradeAccount(password: string): Promise<AT.UpgradeUserResponse> {
    const response = await myFetch("account", "user/upgrade", "PUT", { password });
    return response as AT.UpgradeUserResponse;
}

export async function upgradeToStudentRequest(): Promise<AT.APIResponse> {
    return await myFetch("account", "upgradeToStudentRequest", "POST") as AT.APIResponse;
}

export async function updateUserTextOptionsRecord(userTextOptionsRecord: AT.UserTextOptionsRecord): Promise<AT.UpdateUserTextOptionsRecordResponse> {
    const response = await myFetch("account", "user/userTextOptionsRecord", "PUT", { userTextOptionsRecord }) as AT.UpdateUserTextOptionsRecordResponse;
    return response;
}

export async function signOut() {
    try {
        await myFetch("account", "sign-out", "POST");
    } catch (e) {
        return;
    }
}

export async function getUser(): Promise<undefined | AT.LingdocsUser | "offline"> {
    try {
        const response = await myFetch("account", "user"); 
        if ("user" in response) {
            return response.user;
        }
        return undefined;
    } catch (e) {
        console.error(e);
        return "offline";
    }
}

async function myFetch(
    service: Service,
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: FT.SubmissionsRequest | { password: string } | AT.UpdateUserTextOptionsRecordBody,
): Promise<AT.APIResponse> {
    const response = await fetch(baseUrl[service] + url, {
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
