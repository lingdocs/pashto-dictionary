/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { InlinePs, Types as T } from "@lingdocs/ps-react";
import {
  displayFormResult,
  displayPositionResult,
} from "../lib/inflection-search-helpers";
import { InflectionName, InflectionFormMatch } from "../types/dictionary-types";

function InflectionFormMatchDisplay({
  form,
  textOptions,
  entry,
}: {
  form: InflectionFormMatch;
  textOptions: T.TextOptions;
  entry: T.DictionaryEntry;
}) {
  function getTransitivity():
    | "transitive"
    | "intransitive"
    | "grammatically transitive" {
    if (form.path.includes("grammaticallyTransitive")) {
      return "grammatically transitive";
    }
    if (form.path.includes("transitive")) {
      return "transitive";
    }
    if (entry.c?.includes("intrans.")) {
      return "intransitive";
    }
    return "transitive";
  }
  const transitivity = getTransitivity();
  const isPast = form.path.includes("past") || form.path.includes("perfect");
  const isErgative = transitivity !== "intransitive" && isPast;
  const isVerbPos = (x: InflectionName[] | T.Person[] | null) => {
    if (x === null) return false;
    return typeof x[0] !== "string";
  };
  return (
    <div className="mb-4">
      <div className="mb-2">
        <strong>{displayFormResult(form.path)}</strong>
      </div>
      {form.matches.map((match, i) => (
        <div className="ml-2" key={i}>
          <InlinePs opts={textOptions} ps={match.ps} />
          <div className="ml-4 my-2">
            <em>
              {transitivity === "grammatically transitive" && isPast
                ? "Always 3rd pers. masc. plur."
                : `${
                    isVerbPos(match.pos)
                      ? isErgative
                        ? "Obj.:"
                        : "Subj.:"
                      : ""
                  } ${displayPositionResult(match.pos)}`}
            </em>
          </div>
        </div>
      ))}
    </div>
  );
}

export default InflectionFormMatchDisplay;
