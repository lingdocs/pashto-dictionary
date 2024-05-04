import ReactGA from "react-ga4";
import { LingdocsUser } from "../types/account-types";

export function getAudioPath(ts: number): string {
  return `https://storage.lingdocs.com/audio/${ts}.mp3`;
}

export default function playStorageAudio(
  ts: number,
  p: string,
  user: LingdocsUser | undefined,
  callback: () => void
) {
  if (!ts) return;
  if (user && !user.admin) {
    ReactGA.event({
      category: "sounds",
      action: `quick play ${p} - ${ts}`,
    });
  }
  let audio = new Audio(getAudioPath(ts));
  audio.addEventListener("ended", () => {
    callback();
    audio.remove();
    audio.srcObject = null;
  });
  audio.play().catch((e) => {
    console.error(e);
    alert("Error playing audio - Connect to the internet and try again");
  });
}
