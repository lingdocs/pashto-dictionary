import { compare } from "bcryptjs";
import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as TwitterStrategy } from "passport-twitter";
import {
  getLingdocsUser,
  insertLingdocsUser,
  updateLastLogin,
  updateLingdocsUser,
} from "../lib/couch-db";
import {
  createNewUser,
  getVerifiedEmail,
  getEmailFromGoogleProfile,
} from "../lib/user-utils";
import env from "../lib/env-vars";
import * as T from "../../../website/src/types/account-types";

export const outsideProviders: ("github" | "google" | "twitter")[] = ["github", "google", "twitter"];

function setupPassport(passport: PassportStatic) {
  passport.use(new LocalStrategy({
        usernameField: "email",
      },
      async function(username, password, done) {
        try {
          const user = await getLingdocsUser("email", username);
          if (!user) return done(null, false, { message: "email not found" });
          if (!user.password) return done(null, false, { message: "user doesn't have password" });
          compare(password, user.password, (err, result) => {
            if (err) return done(err);
            if (result === true) {
              const u = updateLastLogin(user);
              insertLingdocsUser(u).then((usr) => {
                return done(null, usr);
              }).catch(console.error);
            } else {
              return done(null, false, { message: "incorrect password" });
            }
          });
        } catch (e) {
          // error looking up user from database
          done(e);
        }
      }
  ));
  passport.use(new GoogleStrategy({
    clientID: "1059009861653-ndh517ctpnats30qlgmihsrol4pdcj12.apps.googleusercontent.com",
    clientSecret: env.googleClientSecret,
    callbackURL: "https://account.lingdocs.com/google/callback",
    passReqToCallback: true,
  },
  async function(req, accessToken, refreshToken, profileRaw, done) {
    const { _json, _raw, ...profile } = profileRaw;
    const gProfile = { ...profile, accessToken, refreshToken };
    try {
      if (req.isAuthenticated()) {
        if (!req.user) done(new Error("user lost"));
        const otherAccountWSameGoogle = await getLingdocsUser("googleId", profile.id);
        if (otherAccountWSameGoogle) {
          return done(null, otherAccountWSameGoogle);
        }
        const u = await updateLingdocsUser(req.user.userId, { google: gProfile });
        if (!u.email) {
          // if the user is adding a google account and doesn't have a previous email, add the google email
          const email = getVerifiedEmail(gProfile)
          if (email) {
            const emailAdded = await updateLingdocsUser(req.user.userId, { email, emailVerified: true });
            return done(null, emailAdded);
          }
        }
        return done(null, u);
      }
      // if there's a google account matching, log them in
      const user = await getLingdocsUser("googleId", profile.id);
      if (user) return done (null, user);
      // if the person used their google email for a plain signup, add the google provider to it and sign in
      const googleMail = getEmailFromGoogleProfile(gProfile);
      if (googleMail.email) {
        const otherAccountWSameEmail = await getLingdocsUser("email", googleMail.email);
        if (otherAccountWSameEmail) {
          await updateLingdocsUser(otherAccountWSameEmail.userId, { google: gProfile });
          return done(null, otherAccountWSameEmail);
        }
      }
      // otherwise create a brand new user
      const u = await createNewUser({ strategy: "google", profile: gProfile });
      return done(null, u);
    } catch (e) {
      done(e);
    }
  }
  ));
  passport.use(new TwitterStrategy({
    consumerKey: "Y6fwSL0BUx7PO8edFgiZMqcLf",
    consumerSecret: env.twitterClientSecret,
    callbackURL: "https://account.lingdocs.com/twitter/callback",
    passReqToCallback: true,
  }, async function(req, token, tokenSecret, profileRaw, done) {
    const { _json, _raw, ...profile } = profileRaw;
    const twitterProfile = { ...profile, token, tokenSecret };
    try {
      if (req.isAuthenticated()) {
        if (!req.user) done(new Error("user lost"));
        const otherAccountWSameTwitter = await getLingdocsUser("twitterId", twitterProfile.id);
        if (otherAccountWSameTwitter) {
          return done(null, otherAccountWSameTwitter);
        }
        const u = await updateLingdocsUser(req.user.userId, { twitter: twitterProfile });
        return done(null, u);
      }
      const user = await getLingdocsUser("twitterId", profile.id);
      if (user) return done (null, user);
      const u = await createNewUser({ strategy: "twitter", profile: twitterProfile });
      return done(null, u);
    } catch (e) {
      done(e);
    }
  }));
  passport.use(new GitHubStrategy({
    clientID: "37abff09e9baf39aff0a",
    clientSecret: env.githubClientSecret,
    callbackURL: "https://account.lingdocs.com/github/callback",
    passReqToCallback: true,
  },
  async function(req: any, accessToken: any, refreshToken: any, profileRaw: any, done: any) {
    // not getting refresh token
    const { _json, _raw, ...profile } = profileRaw;
    const ghProfile: T.GitHubProfile = { ...profile, accessToken };  
    try {
      if (req.isAuthenticated()) {
        if (!req.user) done(new Error("user lost"));
        const otherAccountWSameGithub = await getLingdocsUser("githubId", ghProfile.id);
        if (otherAccountWSameGithub) {
          return done(null, otherAccountWSameGithub);
        }
        const u = await updateLingdocsUser(req.user.userId, { github: ghProfile });
        return done(null, u);
      }
      const user = await getLingdocsUser("githubId", ghProfile.id);
      if (user) return done (null, user);
      const u = await createNewUser({ strategy: "github", profile: ghProfile });
      return done(null, u);
    } catch (e) {
      done(e);
    }
  }));

  // @ts-ignore
  passport.serializeUser((user: LingdocsUser, cb) => {
    // @ts-ignore
    cb(null, user.userId);
  });
  
  passport.deserializeUser(async (userId: T.UUID, cb) => {
    try {
      const user = await getLingdocsUser("userId", userId);
      if (!user) {
        cb(null, false);
        return;
      }
      // THIS IS ERRORING TOO MUCH!
      // try {
      //   // skip if there's an update conflict
      //   const newUser = await updateLingdocsUser(userId, { lastActive: getTimestamp() });
      //   cb(null, newUser);
      // } catch (e) {
      //   console.error(e);
      //   cb(null, user);
      // }
      cb(null, user);
    } catch (err) {
      cb(err, null);
    }
  });  
}

export default setupPassport;