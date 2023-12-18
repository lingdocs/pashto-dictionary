import { Types as T, InlinePs } from "@lingdocs/ps-react";
import { getAudioPath } from "./PlayStorageAudio";

export function EntryAudioDisplay({
  entry,
  opts,
}: {
  entry: T.DictionaryEntry;
  opts: T.TextOptions;
}) {
  if (!entry.a) {
    return null;
  }
  return (
    <figure>
      <figcaption className="mb-1">
        Listen to <InlinePs opts={opts}>{{ p: entry.p, f: entry.f }}</InlinePs>
      </figcaption>
      <audio
        controls
        controlsList="nofullscreen"
        src={getAudioPath(entry.ts)}
        preload="auto"
      >
        <a href={getAudioPath(entry.ts)}>
          Download audio for{" "}
          <InlinePs opts={opts}>{{ p: entry.p, f: entry.f }}</InlinePs>
        </a>
      </audio>
    </figure>
  );
}
