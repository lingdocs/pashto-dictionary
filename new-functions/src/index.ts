import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono");
});

export default app;
