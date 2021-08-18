import PouchDB from "pouchdb";
import * as BT from "./backend-types";

type LocalDbType = "submissions" | "wordlist" | "reviewTasks";
type LocalDb = null | { refresh: () => void, db: PouchDB.Database };
type DbInput = {
    type: "wordlist",
    doc: WordlistWord,
} | {
    type: "submissions",
    doc: BT.Submission,
} | {
    type: "reviewTasks",
    doc: BT.ReviewTask,
};

const dbs: Record<LocalDbType, LocalDb> = {
    /* for anyone logged in - for edits/suggestions submissions */
    submissions: null,
    /* for students and above - personal wordlist database */
    wordlist: null,
    /* for editors only - edits/suggestions (submissions) for review */
    reviewTasks: null,
};

export function initializeLocalDb(type: LocalDbType, refresh: () => void, uid?: string | undefined) {
    const name = type === "wordlist"
        ? `userdb-${uid? stringToHex(uid) : "guest"}`
        : type === "submissions"
        ? "submissions"
        : "review-tasks";
    const db = dbs[type];
    // only initialize the db if it doesn't exist or if it has a different name
    if ((!db) || (db.db?.name !== name)) {
        dbs[type] = {
            db: new PouchDB(name),
            refresh,
        };
        refresh();
    }
}

export function getLocalDbName(type: LocalDbType) {
    return dbs[type]?.db.name;
}

export function deInitializeLocalDb(type: LocalDbType) {
    dbs[type] = null;
}

export function startLocalDbSync(
    type: "wordlist" | "reviewTasks",
    auth: { name: string, password: string },
) {
    const localDb = dbs[type];
    if (!localDb) {
        console.error(`unable to start sync because ${type} database is not initialized`);
        return;
    }
    const sync = localDb.db.sync(
        `https://${auth.name}:${auth.password}@couchdb.lingdocs.com/${localDb.db.name}`, 
        { live: true, retry: true },
    ).on("change", (info) => {
        if (info.direction === "pull") {
            localDb.refresh();
        }
    }).on("error", (error) => {
        console.error(error);
    });
    return sync;
}

export async function addToLocalDb({ type, doc }: DbInput) {
    const localDb = dbs[type];
    if (!localDb) {
        throw new Error(`unable to add doc to ${type} database - not initialiazed`);
    }
    // @ts-ignore
    localDb.db.put(doc, () => {
        localDb.refresh();
    });
    return doc;
}

export async function updateLocalDbDoc({ type, doc }: DbInput, id: string) {
    const localDb = dbs[type];
    if (!localDb) {
        throw new Error(`unable to update doc to ${type} database - not initialized`);
    }
    const oldDoc = await localDb.db.get(id);
    const updated = {
        _rev: oldDoc._rev,
        ...doc,
    }
    // @ts-ignore
    localDb.db.put(updated, () => {
        localDb.refresh();
    });
    return updated;
}

export async function getAllDocsLocalDb(type: "submissions", limit?: number): Promise<BT.Submission[]>;
export async function getAllDocsLocalDb(type: "wordlist", limit?: number): Promise<WordlistWordDoc[]>;
export async function getAllDocsLocalDb(type: "reviewTasks", limit?: number): Promise<BT.ReviewTask[]>
export async function getAllDocsLocalDb(type: LocalDbType, limit?: number): Promise<BT.Submission[] | WordlistWordDoc[] | BT.ReviewTask[]> {
    const localDb = dbs[type];
    if (!localDb) {
        throw new Error(`unable to get all docs from ${type} database - not initialized`);
    }
    const descending = type !== "reviewTasks";
    const result = await localDb.db.allDocs({
        descending,
        include_docs: true,
        [descending ? "startkey" : "endkey"]: "_design",
    });
    const docs = result.rows.map((row) => row.doc) as unknown;
    switch (type) {
        case "submissions":
            return docs as BT.Submission[];
        case "wordlist":
            return docs as WordlistWordDoc[];
        case "reviewTasks":
            return docs as BT.ReviewTask[];
    }
}

export async function getAttachment(type: LocalDbType, docId: string, attachmentId: string) {
    const localDb = dbs[type];
    if (!localDb) {
        throw new Error(`unable to get attachment from ${type} database - not initialized`);
    }
    return await localDb.db.getAttachment(docId, attachmentId);
}

export async function deleteFromLocalDb(type: LocalDbType, id: string | string[]): Promise<void> {
    const localDb = dbs[type];
    if (!localDb) {
        throw new Error(`unable to delete doc from ${type} database - not initialized`);
    }
    if (typeof id === "object") {
        const allDocs = await localDb.db.allDocs({ 
            descending: true,
            include_docs: true,
            "startkey": "_design",
        });
        const toRemove = allDocs.rows.filter((doc) => id.includes(doc.id));
        if (toRemove.length === 0) {
            return;
        }
        const forDeleting = toRemove.map((doc) => ({
            _id: doc.id,
            _rev: doc.value.rev,
            _deleted: true,
        }));
        await localDb.db.bulkDocs(forDeleting);
    } else {
        const doc = await localDb.db.get(id);
        await localDb.db.remove(doc);
    }
    localDb.refresh();
}

function stringToHex(str: string) {
	const arr1 = [];
	for (let n = 0, l = str.length; n < l; n ++) {
		const hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
}
