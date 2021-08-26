import type { LingdocsUser } from "./account-types";

export function wordlistEnabled(user: LingdocsUser | undefined): boolean {
    if (!user) return false;
    return user.level !== "basic";
}