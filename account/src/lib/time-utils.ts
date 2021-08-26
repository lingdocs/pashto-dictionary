import * as T from "../../../website/src/lib/account-types";

export function getTimestamp(): T.TimeStamp {
    return Date.now() as T.TimeStamp;
}