import nodemailer from "nodemailer";
import inProd from "./inProd";
import env from "./env-vars";

type Address = string | { name: string, address: string };

const from: Address = {
    name: "LingDocs Admin",
    address: "admin@lingdocs.com",
};

function getAddress(user: LingdocsUser): Address {
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
    await transporter.sendMail({
        from,
        to,
        subject,
        text,
    });
}

// TODO: MAKE THIS 
const baseURL = inProd ? "https://account.lingdocs.com" : "http://localhost:4000";

export async function sendVerificationEmail(user: LingdocsUser, token: URLToken) {
    const content = `Hello ${user.name},

Please verify your email by visiting this link: ${baseURL}/email-verification/${user.userId}/${token}

LingDocs Admin`;
    await sendEmail(getAddress(user), "Please Verify Your E-mail", content);
}

export async function sendPasswordResetEmail(user: LingdocsUser, token: URLToken) {
    const content = `Hello ${user.name},

Please visit this link to reset your password: ${baseURL}/password-reset/${user.userId}/${token}

LingDocs Admin`;

    await sendEmail(getAddress(user), "Reset Your Password", content);
}