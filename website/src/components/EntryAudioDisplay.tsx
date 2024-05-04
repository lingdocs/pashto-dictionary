import { Types as T, InlinePs } from "@lingdocs/ps-react";
import { getAudioPath } from "./PlayStorageAudio";
import { LingdocsUser } from "../types/account-types";
import ReactGA from "react-ga4";

export function EntryAudioDisplay({
  entry,
  opts,
  user,
}: {
  entry: T.DictionaryEntry;
  opts: T.TextOptions;
  user: LingdocsUser | undefined;
}) {
  if (!entry.a) {
    return null;
  }
  function handlePlay() {
    if (user && user.admin) {
      return;
    }
    ReactGA.event({
      category: "sounds",
      action: `play ${entry.ts} - ${entry.p}`,
    });
  }
  return (
    <figure>
      <figcaption className="mb-2 pl-2">
        Listen to <InlinePs opts={opts}>{{ p: entry.p, f: entry.f }}</InlinePs>
      </figcaption>
      <audio
        controls
        controlsList="nofullscreen"
        src={getAudioPath(entry.ts)}
        preload="auto"
        onPlay={handlePlay}
      >
        <a href={getAudioPath(entry.ts)}>
          Download audio for{" "}
          <InlinePs opts={opts}>{{ p: entry.p, f: entry.f }}</InlinePs>
        </a>
      </audio>
    </figure>
  );
}
