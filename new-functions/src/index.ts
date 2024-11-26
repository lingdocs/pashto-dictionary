import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono updated");
});

app.get("/wa", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi other route");
});

export default app;
