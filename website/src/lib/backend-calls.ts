import * as FT from "../types/functions-types";
import * as AT from "../types/account-types";

type Service = "account" | "functions";

const baseUrl: Record<Service, string> = {
    account: "https://account.lingdocs.com/api/",
    functions: "https://functions.lingdocs.com/",
};

// @ts-ignore
const sampleAdminUser: AT.LingdocsUser = {"_id":"5e8dd381-950f-4641-922d-c63c6bf0f8e9","_rev":"1713-1a299e0d66da62fe4c8d059f0f068cb7","userId":"5e8dd381-950f-4641-922d-c63c6bf0f8e9","email":"clay@mailbox.org","admin":true,"emailVerified":true,"name":"Adam D","password":"$2a$10$JR4AHXXGbFP6sKQrqGO9UuMa3tdzNhbdqBvkjn2MVBuIOHkA/Xkf.","level":"editor","tests":[],"lastLogin":1629893763810,"lastActive":1630414108552,"userTextOptionsRecord":{"lastModified":1629983812750,"userTextOptions":{"spelling":"Afghan","diacritics":false,"dialect":"standard","phonetics":"lingdocs"}},"github":{"id":"71590811","nodeId":"MDQ6VXNlcjcxNTkwODEx","displayName":"LingDocs","username":"lingdocs","profileUrl":"https://github.com/lingdocs","photos":[{"value":"https://avatars.githubusercontent.com/u/71590811?v=4"}],"provider":"github","accessToken":"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"},"twitter":{"id":"1307635660451385344","username":"lingdocs","displayName":"LingDocs","photos":[{"value":"https://pbs.twimg.com/profile_images/1315656283928899584/EJIqjI-I_normal.jpg"}],"provider":"twitter","_accessLevel":"read","token":"1307635660451385344-MhpGAaJ6hFmfJtV97N6gy11FgbamVX","tokenSecret":"QjouJ33sWb2MpCkcUqqRxbfC9bqDyRaIODO9cejDvdusN"},"wordlistDbName":"userdb-35653864643338312d393530662d343634312d393232642d633633633662663066386539","couchDbPassword":"oevewi8iptdqyxax3v1x7t2ngi4uloir53g2y4659ada","google":{"id":"111202697753203366308","displayName":"Adam Dueck","name":{"familyName":"Dueck","givenName":"Adam"},"emails":[{"value":"lingdocsdev@gmail.com","verified":true}],"photos":[{"value":"https://lh3.googleusercontent.com/a/AATXAJx3cxPPpUoosqVzyGR-LcJ48EjpVcOBInkW21E=s96-c"}],"provider":"google","accessToken":"ya29.a0ARrdaM8BOOmaKxAPe_tKuVq0VgBncURPeEUUqV85RKksibmdx-DSY0IPOGXLs7UB8vh0yIpULsCQHiBKKg_l1DtuEmfwkN7F1h5YDyn2Zwd_ytVTE4W93YvdVGHVnX8rTdlEVcXLO2apwhJrBi3PuzTzxa6BTw"}};

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
    return await myFetch("account", "user/upgradeToStudentRequest", "POST") as AT.APIResponse;
}

export async function updateUserTextOptionsRecord(userTextOptionsRecord: AT.UserTextOptionsRecord): Promise<AT.UpdateUserTextOptionsRecordResponse> {
    const response = await myFetch("account", "user/userTextOptionsRecord", "PUT", { userTextOptionsRecord }) as AT.UpdateUserTextOptionsRecordResponse;
    return response;
}

export async function postTestResults(tests: AT.TestResult[]): Promise<AT.PostTestResultsResponse> {
    return await myFetch("account", "user/tests", "PUT", { tests }) as AT.PostTestResultsResponse;
}

export async function signOut() {
    try {
        await myFetch("account", "sign-out", "POST");
    } catch (e) {
        return;
    }
}

export async function getUser(): Promise<undefined | AT.LingdocsUser | "offline"> {
    if (process.env.REACT_APP_ENV === "dev") {
        return sampleAdminUser;
    }
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

export async function myFetch(
    service: Service,
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    // better typing and safety of all this
    body?: FT.SubmissionsRequest | { password: string } | AT.UpdateUserTextOptionsRecordBody | AT.PostTestResultsBody,
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
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return {
            ok: false,
            error: `error parsing json for: ${text}`,
        };
    }
}
