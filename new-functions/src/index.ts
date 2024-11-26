import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/lingdocs-auth";

const app = new Hono();
app.use(cors());

app.get("/", (c) => {
  // c.env.LINGDOCS_COUCHDB
  return c.text("Hi from hono updated");
});

app.get("/wa", authMiddleware, async (c) => {
  return c.json({ user: c.var.user });
});

export default app;
