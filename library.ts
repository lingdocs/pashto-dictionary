import * as AT from "./website/src/types/account-types";
import * as FT from "./website/src/types/functions-types";
import {
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
    getUser,
} from "./website/src/lib/backend-calls";

export {
    // FUNCTIONS
    myFetch,
    signOut,
    upgradeAccount,
    upgradeToStudentRequest,
    updateUserTextOptionsRecord,
    getUser,
    // TYPES
    AT,
    FT,
};
