import * as AT from "../types/account-types";

export function objIsEqual(obj1: any, obj2: any): boolean {
  if (!obj1 || !obj2) return false;
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function userObjIsEqual(
  u1: AT.LingdocsUser | undefined,
  u2: AT.LingdocsUser | undefined
): boolean {
  if (!u1 || !u2) return false;
  function removeFrills(u: AT.LingdocsUser) {
    if (!("_rev" in u)) return u;
    const { lastActive, _rev, ...rest } = u;
    return rest;
  }
  return objIsEqual(removeFrills(u1), removeFrills(u2));
}
