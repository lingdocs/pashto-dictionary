/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    InlinePs,
    Types as T,
} from "@lingdocs/pashto-inflector";
import {
    displayFormResult,
    displayPositionResult,
} from "../lib/inflection-search-helpers";
import {
    InflectionSearchResult,
    InflectionName,
} from "../types/dictionary-types";

function InflectionSearchResult(
    { result, textOptions, entry }:
    { result: InflectionSearchResult, textOptions: T.TextOptions, entry: T.DictionaryEntry }
) {
    function getTransitivity(): "transitive" | "intransitive" | "grammatically transitive" {
        if (result.form.includes("grammaticallyTransitive")) {
            return "grammatically transitive";
        }
        if (result.form.includes("transitive")) {
            return "transitive";
        }
        if (entry.c?.includes("intrans.")) {
            return "intransitive";
        }
        return "transitive";
    }
    const transitivity = getTransitivity();
    const isPast = (result.form.includes("past") || result.form.includes("perfect"));
    const isErgative = (transitivity !== "intransitive") && isPast;
    const isVerbPos = (x: InflectionName[] | T.Person[] | null) => {
        if (x === null) return false;
        return (typeof x[0] !== "string");
    };
    return <div className="mb-4">
        <div className="mb-2"><strong>{displayFormResult(result.form)}</strong></div>
        {result.matches.map((match) => <div className="ml-2">
            <InlinePs opts={textOptions}>{match.ps}</InlinePs>
            <div className="ml-3 my-2">
                <em>
                    {(transitivity === "grammatically transitive" && isPast)
                        ? "Always 3rd pers. masc. plur."
                        : `${isVerbPos(match.pos) ? (isErgative ? "Obj.:" : "Subj.:") : ""} ${displayPositionResult(match.pos)}`}
                </em>
            </div>
        </div>)}
    </div>;
}

export default InflectionSearchResult;
