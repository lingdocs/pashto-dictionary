import * as BT from "./backend-types";
import { auth } from "./firebase";
import {
    postSubmissions,
} from "./backend-calls";
import {
    initializeLocalDb,
    addToLocalDb,
    getAllDocsLocalDb,
    deleteFromLocalDb,
} from "./pouch-dbs";

initializeLocalDb("submissions", () => null);

export function submissionBase(): BT.SubmissionBase {
    if (!auth.currentUser) {
        throw new Error("not signed in");
    }
    return {
        sTs: Date.now(),
        _id: new Date().toJSON(),
        user: {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
        },
    };
}

/**
 * Attempts to send whatever submissions may be lying around in the submissions localdb
 */
export async function sendSubmissions() {
    try {
        const submissions = await getAllDocsLocalDb("submissions");
        if (!submissions.length) return;
        const revRemoved = submissions.map((submission) => ({
            ...submission,
            _rev: undefined,
        }));
        const res = await postSubmissions(revRemoved);
        // delete the submissions that were received from the local submissions db
        res.submissions.forEach((submission) => {
            deleteFromLocalDb("submissions", submission._id);
        });
    } catch (err) {
        console.error("error posting submissions", err);
    }
}

export async function addSubmission(submission: BT.Submission, level: BT.UserLevel) {
    if (level === "editor" && (submission.type === "issue" || submission.type === "entry suggestion" || submission.type === "edit suggestion")) {
        await addToLocalDb({ type: "reviewTasks", doc: submission })
    } else {
        await addToLocalDb({ type: "submissions", doc: submission });
        await sendSubmissions();
    }
}

