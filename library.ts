import * as AT from "./website/src/types/account-types";
import * as FT from "./website/src/types/functions-types";
import {
    getTimestamp,
} from "./account/src/lib/time-utils";
import {
    userObjIsEqual,
    objIsEqual,
} from "./website/src/lib/misc-helpers";
import {
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
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
    // fetching
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
    getUser,
    postTestResults,
    // withLingdocsUser functions
    lingdocsUserExpressMiddleware,
    withLingdocsUserApiRoute,
    withLingdocsUserSsr,
    // TYPES
    AT,
    FT,
};
