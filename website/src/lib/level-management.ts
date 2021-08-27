import type { LingdocsUser } from "../types/account-types";

export function wordlistEnabled(user: LingdocsUser | undefined): boolean {
    if (!user) return false;
    return user.level !== "basic";
}