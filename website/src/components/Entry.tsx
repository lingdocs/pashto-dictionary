/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import ExtraEntryInfo from "../components/ExtraEntryInfo";
import classNames from "classnames";
import { Types as T, InlinePs } from "@lingdocs/ps-react";
import playStorageAudio from "./PlayStorageAudio";

function Entry({
  entry,
  textOptions,
  nonClickable,
  isolateEntry,
  admin,
}: {
  entry: T.DictionaryEntry;
  textOptions: T.TextOptions;
  nonClickable?: boolean;
  isolateEntry?: (ts: number) => void;
  admin: boolean;
}) {
  function handlePlayStorageAudio(
    e: React.MouseEvent<HTMLElement, MouseEvent>
  ) {
    e.stopPropagation();
    playStorageAudio(entry.ts, entry.p, admin, () => null);
  }
  return (
    <div
      className={classNames("entry", { clickable: !nonClickable })}
      onClick={
        !nonClickable && isolateEntry ? () => isolateEntry(entry.ts) : undefined
      }
      data-testid="entry"
    >
      <div>
        <dt className="mr-2">
          <InlinePs opts={textOptions}>{{ p: entry.p, f: entry.f }}</InlinePs>
        </dt>
        {` `}
        <em>{entry.c}</em>
        {entry.a && !nonClickable && (
          <i
            onClick={handlePlayStorageAudio}
            className="clickable ml-2 fas fa-volume-down px-1"
            title="play audio"
          />
        )}
      </div>
      <ExtraEntryInfo entry={entry} textOptions={textOptions} />
      <dd>
        <div className="entry-definition">{entry.e}</div>
      </dd>
    </div>
  );
}

export default Entry;
