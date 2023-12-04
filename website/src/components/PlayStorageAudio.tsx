export default function playStorageAudio(ts: number, callback: () => void) {
  if (!ts) return;
  let audio = new Audio(`https://storage.lingdocs.com/audio/${ts}.mp3`);
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
