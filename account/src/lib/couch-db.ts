import Nano from "nano";
import { DocumentInsertResponse } from "nano";
import { getTimestamp } from "./time-utils";
import env from "./env-vars";
import * as T from "../../../website/src/types/account-types";

const nano = Nano(env.couchDbURL);
const usersDb = nano.db.use("lingdocs-users");
const feedbackDb = nano.db.use("feedback");
const paymentsDb = nano.db.use("payments");
const userDbPrefix = "userdb-";

export async function addFeedback(feedback: any) {
  await feedbackDb.insert(feedback);
}

export async function addToPaymentsDb(payment: any) {
  await paymentsDb.insert(payment);
}

export function updateLastLogin(user: T.LingdocsUser): T.LingdocsUser {
  return {
    ...user,
    lastLogin: getTimestamp(),
  };
}

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

export async function getLingdocsUser(
  field: "email" | "userId" | "githubId" | "googleId" | "twitterId",
  value: string
): Promise<undefined | T.LingdocsUser> {
  const user = await usersDb.find({
    selector:
      field === "githubId"
        ? { github: { id: value } }
        : field === "googleId"
        ? { google: { id: value } }
        : field === "twitterId"
        ? { twitter: { id: value } }
        : { [field]: value },
  });
  if (!user.docs.length) {
    return undefined;
  }
  return user.docs[0] as T.LingdocsUser;
}

export async function getAllLingdocsUsers(): Promise<T.LingdocsUser[]> {
  const users = await usersDb.find({
    selector: { userId: { $exists: true } },
    limit: 5000,
  });
  return users.docs as T.LingdocsUser[];
}

export async function getAllFeedback(): Promise<any[]> {
  const res = await feedbackDb.find({
    selector: {
      feedback: { $exists: true },
    },
    limit: 5000,
  });
  const docs = res.docs;
  // @ts-ignore
  docs.sort((a, b) => b.feedback.ts - a.feedback.ts);
  return docs as any[];
}

export async function insertLingdocsUser(
  user: T.LingdocsUser
): Promise<T.LingdocsUser> {
  try {
    const res = await usersDb.insert(user);
    const newUser = processAPIResponse(user, res);
    if (!newUser) {
      throw new Error("error inserting user");
    }
    return newUser;
  } catch (e) {
    console.log("ERROR on insertLingdocsUser", user);
    throw new Error("error inserting user - on update");
  }
}

export async function deleteLingdocsUser(uuid: T.UUID): Promise<void> {
  const user = await getLingdocsUser("userId", uuid);
  await deleteCouchDbAuthUser(uuid);
  if (!user) return;
  // TODO: cleanup userdbs etc
  // TODO: Better type certainty here... obviously there is an _id and _rev here
  await usersDb.destroy(user._id as string, user._rev as string);
}

export async function deleteCouchDbAuthUser(uuid: T.UUID): Promise<void> {
  const authUsers = nano.db.use("_users");
  const user = await authUsers.find({ selector: { name: uuid } });
  if (!user.docs.length) return;
  const u = user.docs[0];
  await authUsers.destroy(u._id, u._rev);
  await nano.db.destroy(getWordlistDbName(uuid));
}

export async function updateLingdocsUser(
  uuid: T.UUID,
  toUpdate: // TODO: OR USE REDUCER??
  | { name: string }
    | { name?: string; email: string; emailVerified: T.Hash }
    | { email: string; emailVerified: true }
    | { emailVerified: T.Hash }
    | { emailVerified: true }
    | { password: T.Hash }
    | { google: T.GoogleProfile | undefined }
    | { github: T.GitHubProfile | undefined }
    | { twitter: T.TwitterProfile | undefined }
    | {
        passwordReset: {
          tokenHash: T.Hash;
          requestedOn: T.TimeStamp;
        };
      }
    | {
        level: "student";
        wordlistDbName: T.WordlistDbName;
        couchDbPassword: T.UserDbPassword;
        upgradeToStudentRequest: undefined;
        subscription?: T.StripeSubscription;
      }
    | {
        level: "basic";
        wordlistDbName: undefined;
        couchDbPassword: undefined;
        upgradeToStudentRequest: undefined;
        subscription: undefined;
      }
    | { upgradeToStudentRequest: "waiting" }
    | { upgradeToStudentRequest: "denied" }
    | { tests: T.TestResult[] }
    | { wordlistDbName: T.WordlistDbName; couchDbPassword: T.UserDbPassword }
): Promise<T.LingdocsUser> {
  const user = await getLingdocsUser("userId", uuid);
  if (!user) throw new Error("unable to update - user not found " + uuid);
  if ("tests" in toUpdate) {
    return await insertLingdocsUser({
      ...user,
      tests: addNewTests(user.tests, toUpdate.tests, 2),
    });
  }
  if ("password" in toUpdate) {
    const { passwordReset, ...u } = user;
    return await insertLingdocsUser({
      ...u,
      ...toUpdate,
    });
  }
  return await insertLingdocsUser({
    ...user,
    ...toUpdate,
  });
}

export async function addCouchDbAuthUser(
  uuid: T.UUID
): Promise<{ password: T.UserDbPassword; userDbName: T.WordlistDbName }> {
  const password = generateWordlistDbPassword();
  const userDbName = getWordlistDbName(uuid);
  const usersDb = nano.db.use("_users");
  // TODO: prevent conflict if adding an existing user for some reason
  const authUser: T.CouchDbAuthUser = {
    _id: `org.couchdb.user:${uuid}`,
    type: "user",
    roles: [],
    name: uuid,
    password,
  };
  await usersDb.insert(authUser);
  await nano.db.create(userDbName);
  const userDb = nano.db.use(userDbName);
  await userDb.insert(
    {
      // @ts-ignore
      admins: {
        names: [uuid],
        roles: ["_admin"],
      },
      members: {
        names: [uuid],
        roles: ["_admin"],
      },
    },
    "_security"
  );
  return { password, userDbName };
}

// Instead of these functions, I'm using couch_peruser
// export async function createWordlistDatabase(uuid: T.UUID, password: T.UserDbPassword): Promise<{ name: T.WordlistDbName, password: T.UserDbPassword }> {
//   const name = getWordlistDbName(uuid);
//   // create wordlist database for user
//   await nano.db.create(name);
//   const securityInfo = {
//       admins: {
//           names: [uuid],
//           roles: ["_admin"]
//       },
//       members: {
//           names: [uuid],
//           roles: ["_admin"],
//       },
//   };
//   const userDb = nano.db.use(name);
//   await userDb.insert(securityInfo as any, "_security");
//   return { password, name };
// }

// export async function deleteWordlistDatabase(uuid: T.UUID): Promise<void> {
//   const name = getWordlistDbName(uuid);
//   try {
//     await nano.db.destroy(name);
//   } catch (e) {
//     // allow the error to pass if we're just trying to delete a database that never existed
//     if (e.message !== "Database does not exist.") {
//       throw new Error("error deleting database");
//     }
//   }
// }

export function getWordlistDbName(uid: T.UUID): T.WordlistDbName {
  return `${userDbPrefix}${stringToHex(uid)}` as T.WordlistDbName;
}

export function generateWordlistDbPassword(): T.UserDbPassword {
  function makeChunk(): string {
    return Math.random().toString(36).slice(2);
  }
  const password = new Array(4)
    .fill(0)
    .reduce((acc: string): string => acc + makeChunk(), "");
  return password as T.UserDbPassword;
}

function stringToHex(str: string) {
  const arr1 = [];
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
}

/**
 * Adds new tests to a users record, only keeping up to amountToKeep records of the most
 * recent repeat passes/fails
 *
 * @param existing - the existing tests in a users record
 * @param newResults - the tests to be added to a users record
 * @param amountToKeep - the amount of repeat tests to keep (defaults to 2)
 */
function addNewTests(
  existing: Readonly<T.TestResult[]>,
  toAdd: T.TestResult[],
  amountToKeep = 2
): T.TestResult[] {
  const tests = [...existing];
  // check to make sure that we're only adding test results that are not already added
  const newTests = toAdd.filter((t) => !tests.some((x) => x.time === t.time));
  newTests.forEach((nt) => {
    const repeats = tests.filter((x) => x.id === nt.id && x.done === nt.done);
    if (repeats.length > amountToKeep - 1) {
      // already have enough repeat passes saved, remove the oldest one
      const i = tests.findIndex((x) => x.time === repeats[0].time);
      if (i > -1) tests.splice(i, 1);
    }
    tests.push(nt);
  });
  return tests;
}
