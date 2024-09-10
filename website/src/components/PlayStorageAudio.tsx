import ReactGA from "react-ga4";
import { Types as T } from "@lingdocs/ps-react";

export function getAudioPath(ts: number, gender: T.Gender): string {
  return `https://storage.lingdocs.com/audio/${ts}${
    gender === "fem" ? "f" : ""
  }.mp3`;
}

export default function playStorageAudio(
  ts: number,
  gender: T.Gender,
  p: string,
  callback: () => void
) {
  if (!ts) return;
  ReactGA.event({
    category: "sounds",
    action: `quick play ${p} - ${ts}`,
  });
  let audio = new Audio(getAudioPath(ts, gender));
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
