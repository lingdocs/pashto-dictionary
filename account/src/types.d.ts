type Hash = string & { __brand: "Hashed String" };
type UUID = string & { __brand: "Random Unique UID" };
type TimeStamp = number & { __brand: "UNIX Timestamp in milliseconds" };
type UserDbPassword = string & { __brand: "password for an individual user couchdb" };
type URLToken = string & { __brand: "Base 64 URL Token" };
type EmailVerified = true | Hash | false;
type ActionComplete = { ok: true, message: string };
type ActionError = { ok: false, error: string };
type APIResponse = ActionComplete | ActionError | { ok: true, user: LingdocsUser };

type WoutRJ<T> = Omit<T, "_raw"|"_json">;

type GoogleProfile = WoutRJ<import("passport-google-oauth").Profile> & { refreshToken: string, accessToken: string };
type GitHubProfile = WoutRJ<import("passport-github2").Profile> & { accessToken: string };
type TwitterProfile = WoutRJ<import("passport-twitter").Profile> & { token: string, tokenSecret: string };
type ProviderProfile = GoogleProfile | GitHubProfile | TwitterProfile;
type UserLevel = "basic" | "student" | "editor"; 

// TODO: TYPE GUARDING SO WE NEVER HAVE A USER WITH NO Id or Password
type LingdocsUser = {
    userId: UUID,
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
    tests: [],
    lastLogin: TimeStamp,
    lastActive: TimeStamp,
} & ({ level: "basic"} | { level: "student" | "editor", userDbPassword: UserDbPassword })
& import("nano").MaybeDocument;
