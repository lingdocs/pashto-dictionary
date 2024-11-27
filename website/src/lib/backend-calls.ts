import * as FT from "../types/functions-types";
import * as AT from "../types/account-types";

type Service = "account" | "submissions" | "functions";

const baseUrl: Record<Service, string> = {
  account: "https://account.lingdocs.com/api/",
  // clean up redundancy in call, put it all in api?
  submissions: "https://account.lingdocs.com/",
  functions: "https://functions.lingdocs.com/",
};

export async function publishDictionary(): Promise<
  FT.PublishDictionaryResponse | FT.FunctionError
> {
  return (await myFetch("functions", "publish")) as
    | FT.PublishDictionaryResponse
    | FT.FunctionError;
}

export async function postSubmissions(
  submissions: FT.SubmissionsRequest
): Promise<FT.SubmissionsResponse> {
  return (await myFetch(
    "submissions",
    "submissions",
    "POST",
    submissions
  )) as FT.SubmissionsResponse;
}

// ACCOUNT CALLS
export async function upgradeAccount(
  password: string
): Promise<AT.UpgradeUserResponse> {
  const response = await myFetch("account", "user/upgrade", "PUT", {
    password,
  });
  return response as AT.UpgradeUserResponse;
}

export async function upgradeToStudentRequest(): Promise<AT.APIResponse> {
  return (await myFetch(
    "account",
    "user/upgradeToStudentRequest",
    "POST"
  )) as AT.APIResponse;
}

export async function postTestResults(
  tests: AT.TestResult[]
): Promise<AT.PostTestResultsResponse> {
  const response = (await myFetch("account", "user/tests", "PUT", {
    tests,
  })) as AT.PostTestResultsResponse;
  return response;
}

export async function signOut() {
  try {
    await myFetch("account", "sign-out", "POST");
  } catch (e) {
    return;
  }
}

export async function getUser(): Promise<
  undefined | AT.LingdocsUser | "offline"
> {
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
  body?:
    | FT.SubmissionsRequest
    | { password: string }
    | AT.UpdateUserTextOptionsRecordBody
    | AT.PostTestResultsBody
): Promise<AT.APIResponse> {
  const response = await fetch(baseUrl[service] + url, {
    method,
    credentials: "include",
    ...(body
      ? {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      : {}),
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
