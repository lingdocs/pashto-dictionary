import { Context } from "hono";
import { env } from "hono/adapter";

export type FEnvironment = {
  // AWS_ACCESS_KEY_ID: string;
  // AWS_SECRET_ACCESS_KEY: string;
  LINGDOCS_DICTIONARY_SPREADSHEET: string;
  LINGDOCS_DICTIONARY_SHEET_ID: string;
  LINGDOCS_SERVICE_ACCOUNT_EMAIL: string;
  LINGDOCS_SERVICE_ACCOUNT_KEY: string;
  DICT_R2_ENDPOINT: string;
  DICT_R2_KEY_ID: string;
  DICT_R2_KEY_SECRET: string;
  DICT_R2_BUCKET: string;
};

export const environment: FEnvironment = {
  // AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  // AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  LINGDOCS_DICTIONARY_SPREADSHEET:
    process.env.LINGDOCS_DICTIONARY_SPREADSHEET || "",
  LINGDOCS_DICTIONARY_SHEET_ID: process.env.LINGDOCS_DICTIONARY_SHEET_ID || "",
  LINGDOCS_SERVICE_ACCOUNT_EMAIL:
    process.env.LINGDOCS_SERVICE_ACCOUNT_EMAIL || "",
  LINGDOCS_SERVICE_ACCOUNT_KEY: Buffer.from(
    process.env.LINGDOCS_SERVICE_ACCOUNT_KEY || ""
  ).toString("base64"),
  DICT_R2_ENDPOINT: process.env.DICT_R2_ENDPOINT || "",
  DICT_R2_KEY_ID: process.env.DICT_R2_KEY_ID || "",
  DICT_R2_KEY_SECRET: process.env.DICT_R2_KEY_SECRET || "",
  DICT_R2_BUCKET: process.env.DICT_R2_BUCKET || "",
};

Object.entries(environment).forEach(([key, value]) => {
  if (value === "") {
    console.log(`Missing env var for ${key}`);
    process.exit(1);
  }
});

export function getEnv(c: Context) {
  return env<FEnvironment>(c);
}
