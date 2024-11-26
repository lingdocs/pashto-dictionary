import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import type { LingdocsUser } from "../../website/src/types/account-types";

const app = new Hono();
app.use(cors());

const authMiddleware = createMiddleware<{
  Variables: {
    user: LingdocsUser;
  };
}>(async (c, next) => {
  const cookie = c.req.header("Cookie") || "";
  const r = await fetch("https://account.lingdocs.com/api/user", {
    headers: { cookie },
  });
  const res = (await r.json()) as { ok: boolean; user: LingdocsUser };
  if (res.ok) {
    c.set("user", res.user);
  }
  await next();
});

app.use(authMiddleware);

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono updated");
});

app.get("/wa", async (c) => {
  return c.json({ user: c.var.user });
});

export default app;
