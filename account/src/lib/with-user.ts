import * as AT from "../../../website/src/types/account-types";
import type { Request, Response, NextFunction } from "express";
import type {
    NextApiHandler,
    GetServerSidePropsContext,
    GetServerSidePropsResult,
} from "next";
import sampleUsers from "./sample-users";

declare module "http" {
    interface IncomingMessage {
        user: AT.LingdocsUser | undefined;
    }
}

const devSampleUser = getSampleUser();
function getSampleUser(): AT.LingdocsUser | "none" | undefined {
    const e = process.env.DEV_SAMPLE;
    if (e === "basic" || e === "student" || e === "admin") {
        return sampleUsers[e];
    }
    if (e === "none") return e;
    return undefined;
}

async function fetchUser(cookies: any): Promise<AT.LingdocsUser | undefined> {
    if (!cookies) {
        return undefined;
    }
    const cookie = typeof cookies === "string"
        ? cookies
        : `__session=${cookies.__session}`;
    try {
        const r = await fetch("https://account.lingdocs.com/api/user", { headers: { cookie }});
        const { ok, user } = await r.json();
        if (ok === true && user) {
            return user as AT.LingdocsUser;
        }
    } catch(e) { console.error(e) }
    return undefined;
}

// functions adapted from https://github.com/vvo/iron-session and used similarily, to inculde
// the LingdocsUser in req when signed in

/**
 * express middleware to include the LingdocsUser in req.user if signed in
 * 
 * to get sample users, set the DEV_SAMPLE env var to "basic", "student", "editor", or "admin"
 * 
 * @returns 
 */
export async function lingdocsUserExpressMiddleware(req: Request, res: Response, next: NextFunction) {
    const user = devSampleUser
        ? (devSampleUser === "none" ? undefined : devSampleUser)
        : await fetchUser(req.headers.cookie);
    Object.defineProperty(
        req,
        "user",
        { value: user, writable: false, enumerable: true },
    );
    next();
}

/**
 * wrapper for a next api route to include the LingdocsUser if logged in
 * 
 * Usage:
 * 
 * in next app: pages/api/thing.ts
 * 
 * export default withLingdocsUserApiRoute(
 *   async function thingRoute(req, res) {
 *     ...
 *
 * to get sample users, set the DEV_SAMPLE env var to "basic", "student", "editor", or "admin"
 * 
 * @param handler 
 * @returns 
 */
export function withLingdocsUserApiRoute(handler: NextApiHandler): NextApiHandler {
    return async function nextApiHandlerWrappedWithLingdocsUser(req, res) {
        const user = devSampleUser
            ? (devSampleUser === "none" ? undefined : devSampleUser)
            : await fetchUser(req.headers.cookies);
        Object.defineProperty(
            req,
            "user",
            { value: user, writable: false, enumerable: true },
        );
        return handler(req, res);
    };
}

/**
 * Wrapper for getServer side props to include the LingdocsUser if logged in
 * 
 * usage:
 * 
 * export const getServerSideProps = withLingdocsUserSsr(
 *   async function getServerSideProps({ req }) {
 *      ...
 * to get sample users, set the DEV_SAMPLE env var to "basic", "student", "editor", or "admin"
 *
 * @param handler 
 * @returns 
 */
export function withLingdocsUserSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
    handler: (
        context: GetServerSidePropsContext,
    ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
) {
    return async function nextGetServerSidePropsHandlerWrappedWithLingdocsUser(
        context: GetServerSidePropsContext,
    ) {
        const user = devSampleUser
            ? (devSampleUser === "none" ? undefined : devSampleUser)
            : await fetchUser(context.req.cookies);
        Object.defineProperty(
            context.req,
            "user",
            { value: user, writable: false, enumerable: true },
        );
        return handler(context);
    };
}