# LingDocs Dictionary Monorepo

### NOTE: this mono-repo has been split up archived. The code is working from:

 - https://github.com/lingdocs/pashto-dictionary-spa
 - https://github.com/lingdocs/pashto-dictionary-lambda
 - https://github.com/lingdocs/lingdocs-backend

![LingDocs Logo](./website/public/icons/icon-w-name.png)

## Contents

This monorepo contains:
 - `/dictionary-client` the frontend of the dictionary, a React SPA
 - `/account` a backend authentication server
 - `/functions` backend Firebase functions for use with the dictionary

To update the `@lingdocs/pashto-inflector` dependency accross the project you can use the shell script included:

```sh
./update-inflector.sh [version]
```

### Dictionary Client

SPA Dictionary Frontend

```sh
cd website
npm install
```

#### Development

```sh
npm run dev
```

### Account

Backend authentication server build on express / passport

#### Development

```sh
cd account
npm install
npm run dev
```

### Functions

Backend Firebase functions

```sh
cd functions
npm install
```

#### Development

```sh
firebase login
# get envars locally
firebase functions:config:get > .runtimeconfig.json
# start functions emulator
npm run serve
```

#### CouchDB

When a user upgrades their account level to `student` or `editor`:

1. A doc in the `_users` db is created with their Firebase Authentication info, account level, and a password they can use for syncing their personal wordlistdb
2. A user database is created which they use to sync their personal wordlist.  

There is also a `review-tasks` database which is used to store all the review tasks for editors and syncs with the review tasks in the app for the editor(s). 


