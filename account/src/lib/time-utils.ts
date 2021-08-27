import * as T from "../../../website/src/types/account-types";

export function getTimestamp(): T.TimeStamp {
    return Date.now() as T.TimeStamp;
}