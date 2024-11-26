import { createMiddleware } from "hono/factory";
import type { LingdocsUser } from "../../../website/src/types/account-types";

export const authMiddleware = createMiddleware<{
  Variables: {
    user: LingdocsUser | undefined;
  };
}>(async (c, next) => {
  const cookie = c.req.header("Cookie") || "";
  const r = await fetch("https://account.lingdocs.com/api/user", {
    headers: { cookie },
  });
  const res = (await r.json()) as { ok: boolean; user: LingdocsUser };
  if (res.ok) {
    c.set("user", res.user);
  } else {
    c.set("user", undefined);
  }
  await next();
});
