import ReactGA from "react-ga4";

export function getAudioPath(ts: number): string {
  return `https://storage.lingdocs.com/audio/${ts}.mp3`;
}

export default function playStorageAudio(
  ts: number,
  p: string,
  callback: () => void
) {
  if (!ts) return;
  ReactGA.event({
    category: "sounds",
    action: `quick play ${p} - ${ts}`,
  });
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
