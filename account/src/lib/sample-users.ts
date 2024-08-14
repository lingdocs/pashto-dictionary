import * as AT from "../../../website/src/types/account-types";

const basic: AT.LingdocsUser = {
    "_id":"5e8dd381-950f-4641-922d-c63c6bf0f8e9",
    "_rev":"1713-1a299e0d66da62fe4c8d059f0f068cb7",
    "userId":"5e8dd381-950f-4641-922d-c63c6bf0f8e9" as AT.UUID,
    "email":"bob@example.com",
    "emailVerified":true,
    "name":"Bob Smith",
    "password":"12345" as AT.Hash,
    "level":"basic",
    "tests":[],
    "lastLogin":1629893763810 as AT.TimeStamp,
    "lastActive":1630414108552 as AT.TimeStamp,
};

const student: AT.LingdocsUser = {
    "_id":"5e8dd381-950f-4641-922d-c63c6bf0f8e8",
    "_rev":"1713-1a299e0d66da62fe4c8d059f0f068cb6",
    "userId":"5e8dd381-950f-4641-922d-c63c6bf0f8e9" as AT.UUID,
    "email":"jim@example.com",
    "emailVerified":true,
    "name":"Jim Weston",
    "password":"12345" as AT.Hash,
    "level":"student",
    "tests":[],
    "lastLogin":1629893763810 as AT.TimeStamp,
    "lastActive":1630414108552 as AT.TimeStamp,
    "couchDbPassword": "12345" as AT.UserDbPassword,
    "wordlistDbName": "jim-db" as AT.WordlistDbName,
    subscription: undefined,
};

const admin: AT.LingdocsUser = {
    "_id":"5e8dd381-950f-4641-922d-c63c6bf0f8e8",
    "_rev":"1713-1a299e0d66da62fe4c8d059f0f068cb6",
    "userId":"5e8dd381-950f-4641-922d-c63c6bf0f8e9" as AT.UUID,
    "email":"jim@example.com",
    "emailVerified":true,
    "name":"Frank Weston",
    "password":"12345" as AT.Hash,
    "level":"editor",
    "admin":true,
    "tests":[],
    "lastLogin":1629893763810 as AT.TimeStamp,
    "lastActive":1630414108552 as AT.TimeStamp,
    "couchDbPassword": "12345" as AT.UserDbPassword,
    "wordlistDbName": "jim-db" as AT.WordlistDbName,
    subscription: undefined,
};

const editor: AT.LingdocsUser = {
    "_id":"5e8dd381-950f-4641-922d-c63c6bf0f8e8",
    "_rev":"1713-1a299e0d66da62fe4c8d059f0f068cb6",
    "userId":"5e8dd381-950f-4641-922d-c63c6bf0f8e9" as AT.UUID,
    "email":"jim@example.com",
    "emailVerified":true,
    "name":"Frank Weston",
    "password":"12345" as AT.Hash,
    "level":"editor",
    "tests":[],
    "lastLogin":1629893763810 as AT.TimeStamp,
    "lastActive":1630414108552 as AT.TimeStamp,
    "couchDbPassword": "12345" as AT.UserDbPassword,
    "wordlistDbName": "jim-db" as AT.WordlistDbName,
    subscription: undefined,
};

// @ts-ignore
const users: any = {
    basic,
    student,
    editor,
    admin,
};

export default users;
