const names = [
  "LINGDOCS_EMAIL_HOST",
  "LINGDOCS_EMAIL_USER",
  "LINGDOCS_EMAIL_PASS",
  "LINGDOCS_COUCHDB",
  "LINGDOCS_ACCOUNT_COOKIE_SECRET",
  "LINGDOCS_ACCOUNT_GOOGLE_CLIENT_SECRET",
  "LINGDOCS_ACCOUNT_TWITTER_CLIENT_SECRET",
  "LINGDOCS_ACCOUNT_GITHUB_CLIENT_SECRET",
  "LINGDOCS_ACCOUNT_RECAPTCHA_SECRET",
  "LINGDOCS_ACCOUNT_UPGRADE_PASSWORD",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NTFY_TOPIC",
];

const values = names.map((name) => ({
  name,
  value: process.env[name] || "",
}));

const missing = values.filter((v) => !v.value);
if (missing.length) {
  console.error(
    "Missing evironment variable(s):",
    missing.map((m) => m.name).join(", ")
  );
  process.exit(1);
}

export default {
  emailHost: values[0].value,
  emailUser: values[1].value,
  emailPass: values[2].value,
  couchDbURL: values[3].value,
  cookieSecret: values[4].value,
  googleClientSecret: values[5].value,
  twitterClientSecret: values[6].value,
  githubClientSecret: values[7].value,
  recaptchaSecret: values[8].value,
  upgradePassword: values[9].value,
  stripeSecretKey: values[10].value,
  stripeWebhookSecret: values[11].value,
  ntfyTopic: values[12].value,
};
