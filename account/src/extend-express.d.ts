declare namespace Express {
    export interface Request {
        // TODO: this will be brought in with an import
        user?: LingdocsUser
    }
}
