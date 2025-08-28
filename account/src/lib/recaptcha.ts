import env from "./env-vars";
const secret = env.recaptchaSecret;

export async function validateReCaptcha(response: string): Promise<boolean> {
  const initial = await fetch(
    encodeURI(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`,
    ),
  );
  const answer = await initial.json();
  return !!answer.success;
}

