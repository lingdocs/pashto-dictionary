// a script for making edits to the couchdb records - run with tsnode

import Nano from "nano";
import { DocumentInsertResponse } from "nano";
import env from "./src/lib/env-vars";
import * as T from "../website/src/types/account-types";
import { getAllLingdocsUsers, getLingdocsUser, insertLingdocsUser } from "./src/lib/couch-db";

const nano = Nano(env.couchDbURL);
const usersDb = nano.db.use("lingdocs-users");
const userDbPrefix = "userdb-";

function processAPIResponse(user: T.LingdocsUser, response: DocumentInsertResponse): T.LingdocsUser | undefined {
    if (response.ok !== true) return undefined;
    return {
      ...user,
      _id: response.id,
      _rev: response.rev,
    };
  }

async function main() {
    const users = await getAllLingdocsUsers();
    users.forEach(async (user) => {
        if (user.tests.length) {
            await insertLingdocsUser({
                ...user,
                tests: removeRedundant(user.tests),
            })
            console.log("updated", user.name);
        }
    })
    return "done";
}

function removeRedundant(tests: T.TestResult[]): T.TestResult[] {
    if (tests.length === 0) return tests;
    const first = tests[0];
    const rest = tests.slice(1);
    const redundancies = rest.filter(x => ((x.id === first.id)) && (x.done === first.done));
    return redundancies.length < 2
        ? [first, ...removeRedundant(rest)]
        : removeRedundant(rest);
}

main().then(res => {
    console.log(res);
});
