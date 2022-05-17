export declare type Hash = string & {
    __brand: "Hashed String";
};
export declare type UUID = string & {
    __brand: "Random Unique UID";
};
export declare type TimeStamp = number & {
    __brand: "UNIX Timestamp in milliseconds";
};
export declare type UserDbPassword = string & {
    __brand: "password for an individual user couchdb";
};
export declare type WordlistDbName = string & {
    __brand: "name for an individual user couchdb";
};
export declare type URLToken = string & {
    __brand: "Base 64 URL Token";
};
export declare type EmailVerified = true | Hash | false;
export declare type ActionComplete = {
    ok: true;
    message: string;
    tests?: TestResult[];
};
export declare type ActionError = {
    ok: false;
    error: string;
};
export declare type APIResponse = ActionComplete | ActionError | {
    ok: true;
    user: LingdocsUser;
};
export declare type WoutRJ<T> = Omit<T, "_raw" | "_json">;
export declare type GoogleProfile = WoutRJ<import("passport-google-oauth").Profile> & {
    refreshToken: string;
    accessToken: string;
};
export declare type GitHubProfile = WoutRJ<import("passport-github2").Profile> & {
    accessToken: string;
};
export declare type TwitterProfile = WoutRJ<import("passport-twitter").Profile> & {
    token: string;
    tokenSecret: string;
};
export declare type ProviderProfile = GoogleProfile | GitHubProfile | TwitterProfile;
export declare type UserLevel = "basic" | "student" | "editor";
export declare type UserTextOptions = Omit<import("@lingdocs/pashto-inflector").Types.TextOptions, "pTextSize">;
export declare type UserTextOptionsRecord = {
    lastModified: TimeStamp;
    userTextOptions: UserTextOptions;
};
export declare type TestResult = {
    done: true;
    time: TimeStamp;
    id: string;
};
export declare type LingdocsUser = {
    userId: UUID;
    admin?: boolean;
    password?: Hash;
    name: string;
    email?: string;
    emailVerified: EmailVerified;
    github?: GitHubProfile;
    google?: GoogleProfile;
    twitter?: TwitterProfile;
    passwordReset?: {
        tokenHash: Hash;
        requestedOn: TimeStamp;
    };
    upgradeToStudentRequest?: "waiting" | "denied";
    tests: TestResult[];
    lastLogin: TimeStamp;
    lastActive: TimeStamp;
    userTextOptionsRecord: undefined | UserTextOptionsRecord;
} & ({
    level: "basic";
} | {
    level: "student" | "editor";
    couchDbPassword: UserDbPassword;
    wordlistDbName: WordlistDbName;
}) & import("nano").MaybeDocument;
export declare type CouchDbAuthUser = {
    type: "user";
    name: UUID;
    password: UserDbPassword;
    roles: [];
} & import("nano").MaybeDocument;
export declare type UpgradeUserResponse = {
    ok: false;
    error: "incorrect password";
} | {
    ok: true;
    message: "user already upgraded" | "user upgraded to student";
    user: LingdocsUser;
};
export declare type PostTestResultsBody = {
    tests: TestResult[];
};
export declare type PostTestResultsResponse = {
    ok: true;
    message: "posted test results";
    tests: TestResult[];
};
export declare type UpdateUserTextOptionsRecordBody = {
    userTextOptionsRecord: UserTextOptionsRecord;
};
export declare type UpdateUserTextOptionsRecordResponse = {
    ok: true;
    message: "updated userTextOptionsRecord";
    user: LingdocsUser;
};
