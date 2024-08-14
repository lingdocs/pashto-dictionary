import PouchDB from "pouchdb";
import * as AT from "../types/account-types";
import * as FT from "../types/functions-types";
import { WordlistWord, WordlistWordDoc } from "../types/dictionary-types";

type LocalDbType = "submissions" | "wordlist" | "reviewTasks";

const localDbTypes: LocalDbType[] = ["submissions", "wordlist", "reviewTasks"];

type UnsyncedLocalDb = {
  refresh: () => void;
  db: PouchDB.Database;
};

type SyncedLocalDb = UnsyncedLocalDb & {
  sync: PouchDB.Replication.Sync<any>;
};

type DBS = {
  submissions: undefined | UnsyncedLocalDb;
  wordlist: undefined | SyncedLocalDb;
  reviewTasks: undefined | SyncedLocalDb;
};

type DbInput =
  | {
      type: "wordlist";
      doc: WordlistWord;
    }
  | {
      type: "submissions";
      doc: FT.Submission;
    }
  | {
      type: "reviewTasks";
      doc: FT.ReviewTask;
    };

const dbs: DBS = {
  /* for anyone logged in - for edits/suggestions submissions */
  submissions: undefined,
  /* for students and above - personal wordlist database */
  wordlist: undefined,
  /* for editors only - edits/suggestions (submissions) for review */
  reviewTasks: undefined,
};

export function startLocalDbs(
  user: AT.LingdocsUser,
  refreshFns: { wordlist: () => void; reviewTasks: () => void }
) {
  initializeLocalDb("submissions", () => null, user);
  user.level !== "basic" &&
    initializeLocalDb("wordlist", refreshFns.wordlist, user);
  user.level === "editor" &&
    initializeLocalDb("reviewTasks", refreshFns.reviewTasks, user);
}

function deInitializeLocalDb(type: LocalDbType) {
  const db = dbs[type];
  db && "sync" in db && db.sync.cancel();
  dbs[type] = undefined;
}

export function stopLocalDbs() {
  localDbTypes.forEach((type) => {
    deInitializeLocalDb(type);
  });
}

function initializeLocalDb(
  type: LocalDbType,
  refresh: () => void,
  user: AT.LingdocsUser
) {
  if (type !== "submissions" && "wordlistDb" in user) return;
  const name =
    type === "reviewTasks"
      ? "review-tasks"
      : type === "submissions"
      ? "submissions"
      : type === "wordlist" && "wordlistDbName" in user
      ? user.wordlistDbName
      : "";
  const password = "couchDbPassword" in user ? user.couchDbPassword : "";
  const db = dbs[type];
  // only initialize the db if it doesn't exist or if it has a different name
  if (!db || db.db?.name !== name) {
    if (type === "submissions") {
      dbs[type] = {
        refresh,
        db: new PouchDB(name),
      };
    } else {
      dbs[type]?.sync.cancel();
      const db = new PouchDB(name);
      dbs[type] = {
        db,
        refresh,
        sync: db
          .sync(
            `https://${user.userId}:${password}@couchdb.lingdocs.com/${name}`,
            { live: true, retry: true }
          )
          .on("change", (info) => {
            if (info.direction === "pull") {
              refresh();
            }
          })
          .on("error", (error) => {
            console.error(error);
          }),
      };
    }
    refresh();
  }
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
    throw new Error(
      `unable to update doc to ${type} database - not initialized`
    );
  }
  const oldDoc = await localDb.db.get(id);
  const updated = {
    _rev: oldDoc._rev,
    ...doc,
  };
  // @ts-ignore
  localDb.db.put(updated, () => {
    localDb.refresh();
  });
  return updated;
}

export async function getAllDocsLocalDb(
  type: "submissions",
  limit?: number
): Promise<FT.Submission[]>;
export async function getAllDocsLocalDb(
  type: "wordlist",
  limit?: number
): Promise<WordlistWordDoc[]>;
export async function getAllDocsLocalDb(
  type: "reviewTasks",
  limit?: number
): Promise<FT.ReviewTask[]>;
export async function getAllDocsLocalDb(
  type: LocalDbType
): Promise<FT.Submission[] | WordlistWordDoc[] | FT.ReviewTask[]> {
  const localDb = dbs[type];
  if (!localDb) {
    return [];
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
      return docs as FT.Submission[];
    case "wordlist":
      return docs as WordlistWordDoc[];
    case "reviewTasks":
      return docs as FT.ReviewTask[];
  }
}

export async function getAttachment(
  type: LocalDbType,
  docId: string,
  attachmentId: string
) {
  const localDb = dbs[type];
  if (!localDb) {
    throw new Error(
      `unable to get attachment from ${type} database - not initialized`
    );
  }
  return await localDb.db.getAttachment(docId, attachmentId);
}

export async function deleteFromLocalDb(
  type: LocalDbType,
  id: string | string[]
): Promise<void> {
  const localDb = dbs[type];
  if (!localDb) {
    throw new Error(
      `unable to delete doc from ${type} database - not initialized`
    );
  }
  if (typeof id === "object") {
    const allDocs = await localDb.db.allDocs({
      descending: true,
      include_docs: true,
      startkey: "_design",
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
