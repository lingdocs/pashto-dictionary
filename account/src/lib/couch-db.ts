import Nano from "nano";
import { DocumentInsertResponse } from "nano";
import { getTimestamp } from "./time-utils";
import env from "./env-vars";
import * as T from "../../../website/src/lib/account-types";

const nano = Nano(env.couchDbURL);
const usersDb = nano.db.use("test-users");

export function updateLastActive(user: T.LingdocsUser): T.LingdocsUser {
  return {
    ...user,
    lastActive: getTimestamp(),
  };
}

export function updateLastLogin(user: T.LingdocsUser): T.LingdocsUser {
  return {
    ...user,
    lastLogin: getTimestamp(),
  };
}

function processAPIResponse(user: T.LingdocsUser, response: DocumentInsertResponse): T.LingdocsUser | undefined {
  if (response.ok !== true) return undefined;
  return {
    ...user,
    _id: response.id,
    _rev: response.rev,
  };
}

export async function getLingdocsUser(field: "email" | "userId" | "githubId" | "googleId" | "twitterId", value: string): Promise<undefined | T.LingdocsUser> {
    const user = await usersDb.find({
      selector: field === "githubId"
        ? { github: { id: value }}
        : field === "googleId"
        ? { google: { id: value }}
        : field === "twitterId"
        ? { twitter: { id: value }}
        : { [field]: value },
    });
    if (!user.docs.length) {
      return undefined;
    }
    return user.docs[0] as T.LingdocsUser;
}

export async function insertLingdocsUser(user: T.LingdocsUser): Promise<T.LingdocsUser> {
  const res = await usersDb.insert(user);
  const newUser = processAPIResponse(user, res);
  if (!newUser) {
    throw new Error("error inserting user");
  }
  return newUser;
}

export async function deleteLingdocsUser(uuid: T.UUID): Promise<void> {
  const user = await getLingdocsUser("userId", uuid);
  if (!user) return;
  // TODO: cleanup userdbs etc
  // TODO: Better type certainty here... obviously there is an _id and _rev here
  await usersDb.destroy(user._id as string, user._rev as string);
}

export async function deleteCouchDbAuthUser(uuid: T.UUID): Promise<void> {
  const authUsers = nano.db.use("_users");
  const user = await authUsers.find({ selector: { name: uuid }});
  if (!user.docs.length) return;
  const u = user.docs[0];
  await authUsers.destroy(u._id, u._rev);
}

// TODO: TO MAKE THIS SAFER, PASS IN JUST THE UPDATING FIELDS!!
// TODO: take out the updated object - do just an ID, and then use the toUpdate safe thing
export async function updateLingdocsUser(uuid: T.UUID, toUpdate:
  // TODO: OR USE REDUCER??
  { name: string } |
  { name?: string, email: string, emailVerified: T.Hash } |
  { email: string, emailVerified: true } |
  { emailVerified: T.Hash } |
  { emailVerified: true } |
  { password: T.Hash } |
  { google: T.GoogleProfile | undefined } |
  { github: T.GitHubProfile | undefined } |
  { twitter: T.TwitterProfile | undefined } |
  { 
    passwordReset: {
      tokenHash: T.Hash,
      requestedOn: T.TimeStamp,
    },
  } |
  {
    level: "student",
    wordlistDbName: T.WordlistDbName,
    userDbPassword: T.UserDbPassword,
  }
): Promise<T.LingdocsUser> {
  const user = await getLingdocsUser("userId", uuid);
  if (!user) throw new Error("unable to update - user not found " + uuid);
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

export async function addCouchDbAuthUser(uuid: T.UUID): Promise<{ password: T.UserDbPassword, userDbName: T.WordlistDbName }> {
  const password = generateWordlistDbPassword();
  const userDbName = getWordlistDbName(uuid);
  const usersDb = nano.db.use("_users");
  const authUser: T.CouchDbAuthUser = {
    _id: `org.couchdb.user:${uuid}`,
    type: "user",
    roles: [],
    name: uuid,
    password,
  };
  await usersDb.insert(authUser);
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

function generateWordlistDbPassword(): T.UserDbPassword {
  function makeChunk(): string {
      return Math.random().toString(36).slice(2)
  }
  const password = new Array(4).fill(0).reduce((acc: string): string => (
      acc + makeChunk()
  ), "");
  return password as T.UserDbPassword;
}

function stringToHex(str: string) {
	const arr1 = [];
	for (let n = 0, l = str.length; n < l; n ++) {
		const hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
}

export function getWordlistDbName(uid: T.UUID): T.WordlistDbName {
    return `wordlist-${stringToHex(uid)}` as T.WordlistDbName;
}