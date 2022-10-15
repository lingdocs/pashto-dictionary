export type Hash = string & { __brand: "Hashed String" };
export type UUID = string & { __brand: "Random Unique UID" };
export type TimeStamp = number & { __brand: "UNIX Timestamp in milliseconds" };
export type UserDbPassword = string & { __brand: "password for an individual user couchdb" };
export type WordlistDbName = string & { __brand: "name for an individual user couchdb" };
export type URLToken = string & { __brand: "Base 64 URL Token" };
export type EmailVerified = true | Hash | false;
export type ActionComplete = { ok: true, message: string, tests?: TestResult[] };
export type ActionError = { ok: false, error: string };
export type APIResponse = ActionComplete | ActionError | { ok: true, user: LingdocsUser };

export type WoutRJ<T> = Omit<T, "_raw"|"_json">;

export type GoogleProfile = WoutRJ<import("passport-google-oauth").Profile> & { refreshToken: string, accessToken: string };
export type GitHubProfile = WoutRJ<import("passport-github2").Profile> & { accessToken: string };
export type TwitterProfile = WoutRJ<import("passport-twitter").Profile> & { token: string, tokenSecret: string };
export type ProviderProfile = GoogleProfile | GitHubProfile | TwitterProfile;
export type UserLevel = "basic" | "student" | "editor";

export type UserTextOptions = Omit<import("@lingdocs/ps-react").Types.TextOptions, "pTextSize">;

export type UserTextOptionsRecord = {
    lastModified: TimeStamp,
    userTextOptions: UserTextOptions,
};

export type TestResult = {
    done: boolean,
    time: TimeStamp,
    id: string,
}

export type StripeSubscription = import("stripe").Stripe.Subscription;

// TODO: TYPE GUARDING SO WE NEVER HAVE A USER WITH NO Id or Password
export type LingdocsUser = {
    userId: UUID,
    admin?: boolean,
    password?: Hash,
    name: string,
    email?: string,
    emailVerified: EmailVerified,
    github?: GitHubProfile,
    google?: GoogleProfile,
    twitter?: TwitterProfile,
    passwordReset?: {
        tokenHash: Hash,
        requestedOn: TimeStamp,
    },
    upgradeToStudentRequest?: "waiting" | "denied",
    tests: TestResult[],
    accountCreated?: TimeStamp,
    lastLogin: TimeStamp,
    lastActive: TimeStamp,
} & (
    { level: "basic" } |
    {
        level: "student" | "editor",
        couchDbPassword: UserDbPassword,
        wordlistDbName: WordlistDbName,
        subscription?: StripeSubscription,
    }
) & import("nano").MaybeDocument;

export type CouchDbAuthUser = {
    type: "user",
    name: UUID,
    password: UserDbPassword,
    roles: [],
} & import("nano").MaybeDocument;

export type UpgradeUserResponse = {
    ok: false,
    error: "incorrect password",
} | {
    ok: true,
    message: "user already upgraded" | "user upgraded to student",
    user: LingdocsUser,
};

export type DowngradeUserResponse = {
    ok: true,
    message: "user downgraded to basic",
    user: LingdocsUser,
};

export type PostTestResultsBody = { tests: TestResult[] };
export type PostTestResultsResponse = {
    ok: true,
    message: "posted test results",
    tests: TestResult[],
};

export type UpdateUserTextOptionsRecordBody = { userTextOptionsRecord: UserTextOptionsRecord };

export type UpdateUserTextOptionsRecordResponse = {
    ok: true,
    message: "updated userTextOptionsRecord",
    user: LingdocsUser,
};
