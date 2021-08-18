const nano = require("nano");
const oldCouch = nano(process.env.OLD_WORDLIST_COUCHDB);
const newCouch = nano(process.env.LINGDOCS_COUCHDB);
const email = process.argv[2];
const newEmail = process.argv[3];

function stringToHex(str) {
	const arr1 = [];
	for (let n = 0, l = str.length; n < l; n ++) {
		const hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('');
}

async function getOldWordList() {
    const usersDb = oldCouch.use("_users");
    const res = await usersDb.find({
        selector: {
            originalEmail: email,
        },
    });
    const { name } = res.docs[0];
    const tag = stringToHex(name);
    const userDb = oldCouch.db.use(`userdb-${tag}`);
    const { rows } = await userDb.list({ include_docs: true });
    const allDocs = rows.map((row) => row.doc);
    return allDocs
}

function convertWordList(list) {
    const now = Date.now();
    return list.map((item) => ({
        _id: item._id,
        warmup: "done",
        supermemo: {
            interval: 0,
            repetition: 0,
            efactor: 2.5
        },
        dueDate: now,
        entry: { ...item.w },
        notes: item.notes,
    }));
}

async function uploadToNewDb(wordlist) {
    const usersDb = newCouch.use("_users");
    const res = await usersDb.find({
        selector: {
            email: newEmail || email,
        },
    });
    const { name } = res.docs[0];
    const tag = stringToHex(name);
    const userDb = newCouch.db.use(`userdb-${tag}`);
    await userDb.bulk({ docs: wordlist });
}

// async function updateWarmup() {
//     const usersDb = newCouch.use("_users");
//     const res = await usersDb.find({
//         selector: {
//             email: newEmail || email,
//         },
//     });
//     const { name } = res.docs[0];
//     const tag = stringToHex(name);
//     const userDb = newCouch.db.use(`userdb-${tag}`);
//     const { rows } = await userDb.list({ include_docs: true });
//     const allDocs = rows.map((row) => row.doc);
//     const updated = allDocs.map((d) => ({ ...d, warmup: "done" }));
//     await userDb.bulk({ docs: updated });
// }

async function main() {
    const oldWordList = await getOldWordList();
    const newWordList = convertWordList(oldWordList);
    uploadToNewDb(newWordList)
}

main();


