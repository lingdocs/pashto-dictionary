import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono updated");
});

app.get("/wa", async (c) => {
  const cookie = c.req.header("Cookie") || "";
  const r = await fetch("https://account.lingdocs.com/api/user", {
    headers: { cookie },
  });
  const { ok, user } = await r.json();
  // const {
  //   headers: { cookie },
  // } = c. req;
  // if (!cookie) {
  //   return { req: null, res };
  // }
  // c.env.LINGDOCS_COUCHDB
  return c.json({ ok, user });
});

export default app;
