import { v4 as uuidv4 } from "uuid";
import {
  insertLingdocsUser,
  addCouchDbAuthUser,
  updateLingdocsUser,
  deleteCouchDbAuthUser,
} from "../lib/couch-db";
import { getHash, getEmailTokenAndHash } from "../lib/password-utils";
import { getTimestamp } from "../lib/time-utils";
import {
  sendVerificationEmail,
  sendAccountUpgradeMessage,
} from "../lib/mail-utils";
import { outsideProviders } from "../middleware/setup-passport";
import * as T from "../../../website/src/types/account-types";
import env from "../lib/env-vars";
import Stripe from "stripe";
import { ntfy } from "./ntfy";

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2022-08-01",
});

function getUUID(): T.UUID {
  return uuidv4() as T.UUID;
}

export function canRemoveOneOutsideProvider(user: T.LingdocsUser): boolean {
  if (user.email && user.password) {
    return true;
  }
  const providersPresent = outsideProviders.filter(
    (provider) => !!user[provider]
  );
  return providersPresent.length > 1;
}

export function getVerifiedEmail({
  emails,
}: T.ProviderProfile): string | false {
  return emails &&
    emails.length &&
    // @ts-ignore
    emails[0].verified
    ? emails[0].value
    : false;
}

export function getEmailFromGoogleProfile(profile: T.GoogleProfile): {
  email: string | undefined;
  verified: boolean;
} {
  if (!profile.emails || profile.emails.length === 0) {
    return { email: undefined, verified: false };
  }
  const em = profile.emails[0];
  // @ts-ignore // but the verified value *is* there - if not it's still safe
  const verified = !!em.verified;
  return {
    email: em.value,
    verified,
  };
}

export async function upgradeUser(
  userId: T.UUID,
  subscription?: T.StripeSubscription
): Promise<T.UpgradeUserResponse> {
  // add user to couchdb authentication db
  const { password, userDbName } = await addCouchDbAuthUser(userId);
  // // create user db
  // update LingdocsUser
  const user = await updateLingdocsUser(userId, {
    level: "student",
    wordlistDbName: userDbName,
    couchDbPassword: password,
    upgradeToStudentRequest: undefined,
    subscription,
  });
  if (user.email) {
    sendAccountUpgradeMessage(user).catch(console.error);
  }
  return {
    ok: true,
    message: "user upgraded to student",
    user,
  };
}

export async function downgradeUser(
  userId: T.UUID,
  subscriptionId?: string
): Promise<T.DowngradeUserResponse> {
  await deleteCouchDbAuthUser(userId);
  if (subscriptionId) {
    stripe.subscriptions.del(subscriptionId);
  }
  const user = await updateLingdocsUser(userId, {
    level: "basic",
    wordlistDbName: undefined,
    couchDbPassword: undefined,
    upgradeToStudentRequest: undefined,
    subscription: undefined,
  });
  if (user.email) {
    // TODO
    // sendAccountDowngradeMessage(user).catch(console.error);
  }
  return {
    ok: true,
    message: "user downgraded to basic",
    user,
  };
}

export async function denyUserUpgradeRequest(userId: T.UUID): Promise<void> {
  await updateLingdocsUser(userId, {
    upgradeToStudentRequest: "denied",
  });
}

export async function createNewUser(
  input:
    | {
        strategy: "local";
        email: string;
        name: string;
        passwordPlainText: string;
      }
    | {
        strategy: "github";
        profile: T.GitHubProfile;
      }
    | {
        strategy: "google";
        profile: T.GoogleProfile;
      }
    | {
        strategy: "twitter";
        profile: T.TwitterProfile;
      }
): Promise<T.LingdocsUser> {
  const userId = getUUID();
  const now = getTimestamp();
  if (input.strategy === "local") {
    const email = await getEmailTokenAndHash();
    const password = await getHash(input.passwordPlainText);
    const newUser: T.LingdocsUser = {
      _id: userId,
      userId,
      email: input.email,
      emailVerified: email.hash,
      name: input.name,
      password,
      level: "basic",
      tests: [],
      accountCreated: now,
      lastLogin: now,
      lastActive: now,
    };
    await sendVerificationEmail({
      name: input.name,
      uid: userId,
      email: input.email || "",
      token: email.token,
    });
    ntfy(`new LingDocs user ${input.name} - ${input.email}`);
    const user = await insertLingdocsUser(newUser);
    return user;
  }
  // GitHub || Twitter
  if (input.strategy === "github" || input.strategy === "twitter") {
    const newUser: T.LingdocsUser = {
      _id: userId,
      userId,
      emailVerified: false,
      name: input.profile.displayName || input.profile.username || "",
      [input.strategy]: input.profile,
      level: "basic",
      tests: [],
      accountCreated: now,
      lastLogin: now,
      lastActive: now,
    };
    const user = await insertLingdocsUser(newUser);
    return user;
  }
  // Google
  // TODO: Add e-mail in here
  const { email, verified } = getEmailFromGoogleProfile(input.profile);
  if (email && !verified) {
    const em = await getEmailTokenAndHash();
    const newUser: T.LingdocsUser = {
      _id: userId,
      userId,
      email,
      emailVerified: em.hash,
      name: input.profile.displayName,
      google: input.profile,
      lastLogin: now,
      tests: [],
      lastActive: now,
      accountCreated: now,
      level: "basic",
    };
    const user = await insertLingdocsUser(newUser);
    sendVerificationEmail({
      name: newUser.name,
      uid: newUser.userId,
      email: newUser.email || "",
      token: em.token,
    }).catch(console.error);
    return user;
  }
  const newUser: T.LingdocsUser = {
    _id: userId,
    userId,
    email,
    emailVerified: verified,
    name: input.profile.displayName,
    google: input.profile,
    lastLogin: now,
    tests: [],
    lastActive: now,
    accountCreated: now,
    level: "basic",
  };
  const user = await insertLingdocsUser(newUser);
  return user;
}
