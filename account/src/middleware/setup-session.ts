import session from "express-session";
import { Express } from "express";
import redis from "redis";
import inProd from "../lib/inProd";
import env from "../lib/env-vars";

const FileStore = !inProd ? require("session-file-store")(session) : undefined;

const RedisStore = require("connect-redis")(session);

function setupSession(app: Express) {
    app.use(
        session({
            secret: env.cookieSecret,
            name: "__session",
            resave: true,
            saveUninitialized: false,
            proxy: inProd,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7 * 30 * 6,
                secure: inProd,
                domain: inProd ? "lingdocs.com" : undefined,
                httpOnly: true,
            },
            store: inProd
                ? new RedisStore({ client: redis.createClient() })
                : new FileStore({}),
        })
    );
}

export default setupSession;