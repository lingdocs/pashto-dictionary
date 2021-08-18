import Nano from "nano";
import { DocumentInsertResponse } from "nano";
import { getTimestamp } from "./time-utils";
import env from "./env-vars";

const nano = Nano(env.couchDbURL);
const usersDb = nano.db.use("test-users");

export function updateLastActive(user: LingdocsUser): LingdocsUser {
  return {
    ...user,
    lastActive: getTimestamp(),
  };
}

export function updateLastLogin(user: LingdocsUser): LingdocsUser {
  return {
    ...user,
    lastLogin: getTimestamp(),
  };
}

function processAPIResponse(user: LingdocsUser, response: DocumentInsertResponse): LingdocsUser | undefined {
  if (response.ok !== true) return undefined;
  return {
    ...user,
    _id: response.id,
    _rev: response.rev,
  };
}

export async function getLingdocsUser(field: "email" | "userId" | "githubId" | "googleId" | "twitterId", value: string): Promise<undefined | LingdocsUser> {
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
    return user.docs[0] as LingdocsUser;
}

export async function insertLingdocsUser(user: LingdocsUser): Promise<LingdocsUser> {
  const res = await usersDb.insert(user);
  const newUser = processAPIResponse(user, res);
  if (!newUser) {
    throw new Error("error inserting user");
  }
  return newUser;
}

export async function deleteLingdocsUser(uuid: UUID): Promise<void> {
  const user = await getLingdocsUser("userId", uuid);
  if (!user) return;
  // TODO: cleanup userdbs etc
  // TODO: Better type certainty here... obviously there is an _id and _rev here
  await usersDb.destroy(user._id as string, user._rev as string);
}

// TODO: TO MAKE THIS SAFER, PASS IN JUST THE UPDATING FIELDS!!
// TODO: take out the updated object - do just an ID, and then use the toUpdate safe thing
export async function updateLingdocsUser(uuid: UUID, toUpdate:
  // TODO: OR USE REDUCER??
  { name: string } |
  { name?: string, email: string, emailVerified: Hash } |
  { email: string, emailVerified: true } |
  { emailVerified: Hash } |
  { emailVerified: true } |
  { password: Hash } |
  { google: GoogleProfile | undefined } |
  { github: GitHubProfile | undefined } |
  { twitter: TwitterProfile | undefined } |
  { 
    passwordReset: {
      tokenHash: Hash,
      requestedOn: TimeStamp,
    },
  }
): Promise<LingdocsUser> {
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
