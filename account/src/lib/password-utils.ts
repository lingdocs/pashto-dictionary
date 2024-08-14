import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import base64url from "base64url";
import * as T from "../../../website/src/types/account-types";

const tokenSize = 24;

export async function getHash(p: string): Promise<T.Hash> {
  return (await hash(p, 10)) as T.Hash;
}

export async function getEmailTokenAndHash(): Promise<{
  token: T.URLToken;
  hash: T.Hash;
}> {
  const token = getURLToken();
  const h = await getHash(token);
  return { token, hash: h };
}

export function getURLToken(): T.URLToken {
  return base64url(randomBytes(tokenSize)) as T.URLToken;
}

export function compareToHash(s: string, hash: T.Hash): Promise<boolean> {
  return compare(s, hash);
}
