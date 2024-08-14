import * as AT from "./website/src/types/account-types";
import * as FT from "./website/src/types/functions-types";
import * as DT from "./website/src/types/dictionary-types";
import {
    getTimestamp,
} from "./account/src/lib/time-utils";
import {
    userObjIsEqual,
    objIsEqual,
} from "./website/src/lib/misc-helpers";
import {
    DictionaryDb,
} from "./website/src/lib/dictionary-core";
import {
    allEntries,
    entryFeeder,
    dictionary,
} from "./website/src/lib/dictionary";
import {
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    getUser,
    postTestResults,
} from "./website/src/lib/backend-calls";
import {
    lingdocsUserExpressMiddleware,
    withLingdocsUserApiRoute,
    withLingdocsUserSsr,
} from "./account/src/lib/with-user";

export {
    // FUNCTIONS
    getTimestamp,
    objIsEqual,
    userObjIsEqual,
    DictionaryDb,
    allEntries,
    entryFeeder,
    dictionary,
    // fetching
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    getUser,
    postTestResults,
    // withLingdocsUser functions
    lingdocsUserExpressMiddleware,
    withLingdocsUserApiRoute,
    withLingdocsUserSsr,
    // TYPES
    AT,
    FT,
    DT,
};
