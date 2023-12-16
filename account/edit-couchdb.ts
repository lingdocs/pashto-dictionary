#!/usr/bin/env tsx

// a script for making edits to the couchdb records - run with tsnode

import Nano from "nano";
import { DocumentInsertResponse } from "nano";
import env from "./src/lib/env-vars";
import * as T from "../website/src/types/account-types";
import {
  getAllLingdocsUsers,
  getLingdocsUser,
  insertLingdocsUser,
} from "./src/lib/couch-db";

const nano = Nano(env.couchDbURL);
// const usersDb = nano.db.use("lingdocs-users");
// const userDbPrefix = "userdb-";

function processAPIResponse(
  user: T.LingdocsUser,
  response: DocumentInsertResponse
): T.LingdocsUser | undefined {
  if (response.ok !== true) return undefined;
  return {
    ...user,
    _id: response.id,
    _rev: response.rev,
  };
}

async function main() {
  const users = await getAllLingdocsUsers();
  const usersWDbs = users.filter((x) => x.level !== "basic");
  const paidUsersEmails: string[] = [];
  for (let user of usersWDbs) {
    // if (!user.docs.length) return;
    // const u = user.docs[0];
    // await authUsers.destroy(u._id, u._rev);
    if (user.level === "basic") {
      throw new Error("");
    }
    process.stdout.write(`Checking for db for ${user.name} - ${user.email}...`);
    const userDb = nano.db.use(user.wordlistDbName);
    if (user.subscription) {
      paidUsersEmails.push(user.email);
    }
    try {
      // await userDb.insert(
      //   {
      //     admins: {
      //       names: [user.userId],
      //       roles: ["_admin"],
      //     },
      //     members: {
      //       names: [user.userId],
      //       roles: ["_admin"],
      //     },
      //   },
      //   "_security"
      // );
      const { admins, members } = await userDb.get("_security");
      if (
        admins?.names?.[0] === user.userId &&
        members?.names?.[0] === user.userId
      ) {
        console.log("✅");
      } else {
        console.log("check", user.wordlistDbName);
        console.log("uid", user.userId);
        console.log("RR");
      }
    } catch (e) {
      console.log(e);
      console.log("❌");
      console.log(`needs ${user.wordlistDbName} - ${user.userId}`);
    }
  }
  const allDbs = await nano.db.list();
  const strayDbs = allDbs.reduce<string[]>((acc, curr) => {
    if (!curr.startsWith("userdb-")) {
      return acc;
    }
    if (
      !usersWDbs.some((x) => x.level !== "basic" && x.wordlistDbName === curr)
    ) {
      return [...acc, curr];
    }
    return acc;
  }, []);
  console.log("STRAY USERDBS");
  console.log(strayDbs);
  console.log("PAID USERS EMAILS");
  console.log(paidUsersEmails.join(","));
  return "done";
}

// function removeRedundant(tests: T.TestResult[]): T.TestResult[] {
//     if (tests.length === 0) return tests;
//     const first = tests[0];
//     const rest = tests.slice(1);
//     const redundancies = rest.filter(x => ((x.id === first.id)) && (x.done === first.done));
//     return redundancies.length < 2
//         ? [first, ...removeRedundant(rest)]
//         : removeRedundant(rest);
// }

main().then((res) => {
  console.log(res);
});
