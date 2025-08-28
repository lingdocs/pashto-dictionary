import session from "express-session";
import { Express } from "express";
import { createClient } from "redis";
import inProd from "../lib/inProd";
import env from "../lib/env-vars";
import { RedisStore } from "connect-redis";

const FileStore = !inProd ? require("session-file-store")(session) : undefined;

const redisClient = inProd ? createClient() : undefined;
redisClient?.connect().catch(console.error);

const redisStore = inProd
  ? new RedisStore({
      client: redisClient,
    })
  : undefined;

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
      store: inProd ? redisStore : new FileStore({}),
    }),
  );
}

export default setupSession;

