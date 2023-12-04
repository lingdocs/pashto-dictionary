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

function Entry({
  entry,
  textOptions,
  nonClickable,
  isolateEntry,
}: {
  entry: T.DictionaryEntry;
  textOptions: T.TextOptions;
  nonClickable?: boolean;
  isolateEntry?: (ts: number) => void;
}) {
  return (
    <div
      className={classNames("entry", { clickable: !nonClickable })}
      onClick={
        !nonClickable && isolateEntry ? () => isolateEntry(entry.ts) : undefined
      }
      data-testid="entry"
    >
      <div>
        <strong>
          <InlinePs opts={textOptions}>{{ p: entry.p, f: entry.f }}</InlinePs>
        </strong>
        {` `}
        <em>{entry.c}</em>
        {entry.a && !nonClickable && <i className="ml-2 fas fa-volume-down" />}
      </div>
      <ExtraEntryInfo entry={entry} textOptions={textOptions} />
      <div className="entry-definition">{entry.e}</div>
    </div>
  );
}

export default Entry;
