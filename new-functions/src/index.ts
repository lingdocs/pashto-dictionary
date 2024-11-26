import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use(cors());

app.use(async (c, next) => {
  const cookie = c.req.header("Cookie") || "";
  const r = await fetch("https://account.lingdocs.com/api/user", {
    headers: { cookie },
  });
  const res = await r.json();
  if (res.ok) {
    c.set("user", res.user);
  }
  await next();
});

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono updated");
});

app.get("/wa", async (c) => {
  return c.json({ user: c.var.user });
});

export default app;
