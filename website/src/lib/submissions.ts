import * as FT from "../types/functions-types";
import * as AT from "../types/account-types";
import {
    postSubmissions,
} from "./backend-calls";
import {
    addToLocalDb,
    getAllDocsLocalDb,
    deleteFromLocalDb,
} from "./pouch-dbs";

export function submissionBase(user: AT.LingdocsUser): FT.SubmissionBase {
    return {
        sTs: Date.now(),
        _id: new Date().toJSON(),
        user: {
            name: user.name,
            email: user.email || "",
            userId: user.userId,
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
        if (res.submissions) {
            res.submissions.forEach((submission) => {
                deleteFromLocalDb("submissions", submission._id);
            });
        }
    } catch (err) {
        console.error("error posting submissions", err);
    }
}

export async function addSubmission(submission: FT.Submission, user: AT.LingdocsUser) {
    if (user.level === "editor" && (submission.type === "issue" || submission.type === "entry suggestion" || submission.type === "edit suggestion")) {
        await addToLocalDb({ type: "reviewTasks", doc: submission })
    } else {
        await addToLocalDb({ type: "submissions", doc: submission });
        await sendSubmissions();
    }
}

