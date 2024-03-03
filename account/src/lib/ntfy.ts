import fetch from "node-fetch";

export async function ntfy(message: string) {
  fetch("https://ntfy.sh/uhrv932r4e5w6zmi4-ld", {
    method: "POST",
    body: message,
  }).catch(console.error);
}
