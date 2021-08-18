import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import base64url from "base64url";

const tokenSize = 24;

export async function getHash(p: string): Promise<Hash> {
    return await hash(p, 10) as Hash;
}

export async function getEmailTokenAndHash(): Promise<{ token: URLToken, hash: Hash }> {
    const token = getURLToken();
    const h = await getHash(token);
    return { token, hash: h };
}

export function getURLToken(): URLToken {
    return base64url(randomBytes(tokenSize)) as URLToken;
}

export function compareToHash(s: string, hash: Hash): Promise<boolean> {
    return compare(s, hash);
}
