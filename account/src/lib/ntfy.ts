import envVars from "./env-vars";

export async function ntfy(message: string) {
  fetch(`https://ntfy.sh/${envVars.ntfyTopic}`, {
    method: "POST",
    body: message,
  }).catch(console.error);
}
