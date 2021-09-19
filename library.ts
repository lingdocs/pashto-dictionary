import * as AT from "./website/src/types/account-types";
import * as FT from "./website/src/types/functions-types";
import {
    getTimestamp,
} from "./account/src/lib/time-utils";
import {
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
    getUser,
    postTestResults,
} from "./website/src/lib/backend-calls";

export {
    // FUNCTIONS
    getTimestamp,
    // fetching
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
    getUser,
    postTestResults,
    // TYPES
    AT,
    FT,
};
