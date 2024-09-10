import { Types as T, InlinePs } from "@lingdocs/ps-react";
import { getAudioPath } from "./PlayStorageAudio";
import ReactGA from "react-ga4";
import { getRecordedGenders } from "../lib/recorded-genders";

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
    <div className="mb-4">
      {getRecordedGenders(entry).map((gender) => (
        <EntryRecording entry={entry} opts={opts} gender={gender} />
      ))}
    </div>
  );
}

function EntryRecording({
  entry,
  opts,
  gender,
}: {
  entry: T.DictionaryEntry;
  opts: T.TextOptions;
  gender: T.Gender;
}) {
  const audioPath = getAudioPath(entry.ts, gender);
  if (!entry.a) {
    return null;
  }
  function handlePlay() {
    ReactGA.event({
      category: "sounds",
      action: `play ${entry.p} - ${entry.ts} ${gender}`,
    });
  }

  function handleDownload() {
    ReactGA.event({
      category: "sounds",
      action: `download ${entry.p} - ${entry.ts} ${gender}`,
    });
    const documentName = `${entry.p}-${entry.ts}-${
      gender === "masc" ? "m" : "f"
    }.mp3`;

    fetch(audioPath)
      .then((res) => {
        return res.blob();
      })
      .then((blob) => {
        const href = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = documentName;
        a.href = href;
        a.click();
        a.href = "";
      })
      .catch((err) => console.error(err));
  }
  return (
    <figure>
      <figcaption className="mb-2 pl-2">
        <div style={{ display: "none" }}>
          Listen to <InlinePs opts={opts} ps={{ p: entry.p, f: entry.f }} />:
          {` `}
          {gender === "masc" ? "Male" : "Female"} recording
        </div>
      </figcaption>
      <div className="d-flex align-items-center">
        <div className="mr-2" style={{ width: "1rem" }}>
          {gender === "masc" ? "M" : "F"}
        </div>
        <audio
          controls
          controlsList="nofullscreen"
          src={audioPath}
          preload="auto"
          onPlay={handlePlay}
        >
          {/*         <a href={getAudioPath(entry.ts)}>
          Download audio for{" "}
          <InlinePs opts={opts}>{{ p: entry.p, f: entry.f }}</InlinePs>
        </a > */}
        </audio>
        <button
          type="button"
          onClick={handleDownload}
          className="ml-2 btn btn-light"
          title="download audio"
        >
          <i className="fas fa-download"></i>
        </button>
      </div>
    </figure>
  );
}
