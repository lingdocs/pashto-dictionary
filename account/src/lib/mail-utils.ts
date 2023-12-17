import nodemailer from "nodemailer";
import inProd from "./inProd";
import env from "./env-vars";
import * as T from "../../../website/src/types/account-types";

type Address = string | { name: string; address: string };

const adminAddress: Address = {
  name: "LingDocs Admin",
  address: "admin@lingdocs.com",
};

export function getAddress(user: T.LingdocsUser): Address {
  // TODO: Guard against ""
  if (!user.name) return user.email || "";
  return {
    name: user.name,
    address: user.email || "",
  };
}

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: 465,
  secure: true,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

async function sendEmail(to: Address, subject: string, text: string) {
  return await transporter.sendMail({
    from: adminAddress,
    to,
    subject,
    text,
  });
}

// TODO: MAKE THIS A URL ACROSS PROJECT
const baseURL = inProd
  ? "https://account.lingdocs.com"
  : "http://localhost:4000";

export async function sendVerificationEmail({
  name,
  uid,
  email,
  token,
}: {
  name: string;
  uid: T.UUID;
  email: string;
  token: T.URLToken;
}) {
  const subject = "Please Verify Your E-mail";
  const content = `Hello ${name},

Please verify your email by visiting this link: ${baseURL}/email-verification/${uid}/${token}

LingDocs Admin`;
  await sendEmail(email, subject, content);
}

export async function sendPasswordResetEmail(
  user: T.LingdocsUser,
  token: T.URLToken
) {
  const subject = "Reset Your Password";
  const content = `Hello ${user.name},

Please visit this link to reset your password: ${baseURL}/password-reset/${user.userId}/${token}

LingDocs Admin`;

  await sendEmail(getAddress(user), subject, content);
}

export async function sendAccountUpgradeMessage(user: T.LingdocsUser) {
  const subject = "You're Upgraded to Student";
  const content = `Hello ${user.name},
    
Congratulations on your upgrade to a LingDocs Student account! 👨‍🎓

Now you can start using your wordlist in the dictionary. It will automatically sync across any devices you're signed in to.

LingDocs Admin`;

  await sendEmail(getAddress(user), subject, content);
}

export async function sendUpgradeRequestToAdmin(
  userWantingToUpgrade: T.LingdocsUser
) {
  const subject = "Account Upgrade Request";
  const content = `${userWantingToUpgrade.name} - ${userWantingToUpgrade.email} - ${userWantingToUpgrade.userId} is requesting to upgrade to student.`;
  await sendEmail(adminAddress, subject, content);
}
