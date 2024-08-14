export const refreshFunctions = {
  submissions: () => null,
  wordlist: () => null,
  reviewTasks: () => null,
};

export function initializeLocalDb(
  type: "submissions" | "wordlist" | "reviewTasks",
  refresh: () => void,
  _?: string | undefined
) {
  if (type === "wordlist") {
    // @ts-ignore
    refreshFunctions.wordlist = refresh;
  }
}

export function refreshWordlist() {
  refreshFunctions.wordlist();
}

export function deInitializeLocalDb(
  _: "submissions" | "wordlist" | "reviewTasks"
) {
  return null;
}

export function startLocalDbSync() {
  return null;
}

export function getLocalDbName() {
  return "";
}
export function getAllDocsLocalDb() {
  return [];
}
