import * as functions from "firebase-functions";
import publish from "./publish";
import {
    receiveSubmissions,
} from "./submissions";
import generatePassword from "./generate-password";
import * as BT from "../../website/src/lib/backend-types"
import cors from "cors";
import * as admin from "firebase-admin";
import { getUserDbName } from "./lib/userDbName";

const nano = require("nano")(functions.config().couchdb.couchdb_url);
const usersDb = nano.db.use("_users");

admin.initializeApp();

const validateFirebaseIdToken = async (req: any, res: any, next: any) => {
    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
      res.status(403).send({ message: "Unauthorized" });
      return;
    }
  
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if(req.cookies) {
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      res.status(403).send({ message: "Unauthorized" });
      return;
    }
  
    try {
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedIdToken;
      next();
      return;
    } catch (error) {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send({ message: "Unauthorized" });
      return;
    }
};

const isEditor = async (req: any) => {
    const uid = req.user.uid as string;
    const couchDbUser = await getCouchDbUser(uid);
    return !!couchDbUser && couchDbUser.level === "editor";
}

export const publishDictionary = functions
    .region("europe-west1")
    .runWith({
        timeoutSeconds: 200,
        memory: "2GB"
    })
    .https.onRequest((req, res) => {
        return cors({ origin: true })(req, res, () => {
            validateFirebaseIdToken(req, res, async () => {
                try {
                    const response = await publish();
                    return res.send(response);
                } catch (error) {
                    return res.status(500).send({
                        error: error.toString(),
                    });
                }
            });
        });
});

// TODO: BETTER HANDLING OF EXPRESS MIDDLEWARE

export const submissions = functions
    .region("europe-west1")
    .runWith({
        timeoutSeconds: 30,
        memory: "1GB"
    })
    .https.onRequest((req, res) => {
        return cors({ origin: true })(req, res, () => {
            validateFirebaseIdToken(req, res, async () => {
                if (!Array.isArray(req.body)) {
                    res.status(400).send({
                        ok: false,
                        error: "invalid submission",
                    });
                    return;
                }
                const suggestions = req.body as BT.SubmissionsRequest;
                // @ts-ignore
                const uid = req.user.uid as string;
                const editor = await isEditor(req);
                try {
                    const response = await receiveSubmissions(suggestions, editor);
                    // TODO: WARN IF ANY OF THE EDITS DIDN'T HAPPEN
                    res.send(response);
                    return;
                } catch (error) {
                    console.error(error);
                    return res.status(500).send({
                        error: error.toString(),
                    });
                };
            }).catch(console.error);
    });
});

export const getUserInfo = functions.region("europe-west1").https.onRequest((req, res) => {
    return cors({ origin: true })(req, res, () => {
        validateFirebaseIdToken(req, res, async () => {
            try {
                // @ts-ignore
                const uid = req.user.uid as string;
                const user = await getCouchDbUser(uid);
                if (!user) {
                    const noneFound: BT.GetUserInfoResponse = {
                        ok: true,
                        message: "no couchdb user found",
                    };
                    res.send(noneFound);
                    return;
                }
                const userFound: BT.GetUserInfoResponse = { ok: true, user };
                res.send(userFound);
                return;
            } catch(error) {
                console.error(error);
                res.status(500).send({
                    ok: false,
                    error: error.message,
                });
            }
        }).catch(console.error); 
    });
});

// export const cleanUpUser = functions
//     .region("europe-west1")
//     .auth.user().onDelete(async (user) => {
//         const couchDbUser = await getCouchDbUser(user.uid);
//         if (!couchDbUser) return;
//         await usersDb.destroy(
//             `org.couchdb.user:${user.uid}`,
//             couchDbUser._rev,
//         );
//         try {
//             await nano.db.destroy(getUserDbName(user.uid));
//         } catch (e) {
//             console.log("errored destroying", e);
//         };
//     });

export const upgradeUser = functions.region("europe-west1").https.onRequest((req, res) => {
    return cors({ origin: true })(req, res, () => {
        validateFirebaseIdToken(req, res, async () => {
            const password = (req.body.password || "") as string;
            const studentPassword = functions.config().upgrades.student_password as string;
            if (password.toLowerCase() !== studentPassword.toLowerCase()) {
                const wrongPass: BT.UpgradeUserResponse = {
                    ok: false,
                    error: "incorrect password",
                };
                res.send(wrongPass);
                return;
            }
            // @ts-ignore
            const uid = req.user.uid;
            const couchDbUser = await getCouchDbUser(uid);
            if (couchDbUser) {
                const alreadyUpgraded: BT.UpgradeUserResponse = {
                    ok: true,
                    message: "user already upgraded",
                };
                res.send(alreadyUpgraded);
                return;
            }
            const user = await admin.auth().getUser(uid);
            const userdbPassword = generatePassword();
            const newCouchDbUser: BT.CouchDbUser = {
                _id: `org.couchdb.user:${user.uid}`,
                type: "user",
                name: user.uid,
                email: user.email || "",
                providerData: user.providerData,
                displayName: user.displayName || "",
                roles: [],
                password: userdbPassword,
                level: "student",
                userdbPassword,
            };
            await usersDb.insert(newCouchDbUser);
            // create wordlist database for user
            const userDbName = getUserDbName(user.uid);
            await nano.db.create(userDbName);
            const securityInfo = {
                admins: {
                   names: [user.uid],
                   roles: ["_admin"]
                },
                members: {
                   names: [user.uid],
                   roles: ["_admin"],
                },
            };
            const userDb = nano.db.use(userDbName);
            await userDb.insert(securityInfo, "_security");
            // TODO: SET THE USERDBPASSWORD TO BE userdbPassword;
            const upgraded: BT.UpgradeUserResponse = {
                ok: true,
                message: "user upgraded to student",
            };
            res.send(upgraded);
        }).catch(console.error);
    });
});

async function getCouchDbUser(uid: string): Promise<undefined | BT.CouchDbUser> {
    const user = await usersDb.find({
        selector: {
            name: uid,
        }
    });
    if (!user.docs.length) {
        return undefined;
    }
    return user.docs[0] as BT.CouchDbUser;
}