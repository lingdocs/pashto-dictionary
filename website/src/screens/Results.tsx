/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from "react";
import * as FT from "../types/functions-types";
import { submissionBase, addSubmission } from "../lib/submissions";
import { isPashtoScript } from "../lib/is-pashto";
import Entry from "../components/Entry";
import { Helmet } from "react-helmet";
import InflectionFormMatchDisplay from "../components/InflectionFormMatchDisplay";
import { getTextOptions } from "../lib/get-text-options";
import { State } from "../types/dictionary-types";

export const inflectionSearchIcon = "fas fa-search-plus";

// TODO: put power results in a prop so we can do it from outside with the keyboard shortcut
function Results({
  state,
  isolateEntry,
  handleInflectionSearch,
  relatedResults,
}: {
  state: State;
  isolateEntry: (ts: number) => void;
  handleInflectionSearch: () => void;
  relatedResults?: boolean;
}) {
  const [suggestionState, setSuggestionState] = useState<
    "none" | "editing" | "received"
  >("none");
  const [comment, setComment] = useState<string>("");
  const [pashto, setPashto] = useState<string>("");
  const [phonetics, setPhonetics] = useState<string>("");
  const [english, setEnglish] = useState<string>("");
  const textOptions = getTextOptions(state);
  function startSuggestion() {
    const toStart = state.searchValue;
    if (isPashtoScript(toStart)) {
      setPashto(toStart);
      setPhonetics("");
    } else {
      setPashto("");
      setPhonetics(toStart);
    }
    setSuggestionState("editing");
  }
  function cancelSuggestion() {
    setPashto("");
    setPhonetics("");
    setSuggestionState("none");
  }
  function submitSuggestion(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();
    if (!state.user) return;
    const p = pashto;
    const f = phonetics;
    const e = english;
    const newEntry: FT.EntrySuggestion = {
      ...submissionBase(state.user),
      type: "entry suggestion",
      entry: { ts: 0, i: 0, p, f, g: "", e },
      comment,
    };
    addSubmission(newEntry, state.user);
    setSuggestionState("received");
  }
  const inflectionResults = state.inflectionSearchResults;
  const admin = !!state.user?.admin;
  return (
    <div className="width-limiter">
      {!relatedResults && (
        <Helmet>
          <title>LingDocs Pashto Dictionary</title>
        </Helmet>
      )}
      {state.user &&
        window.location.pathname !== "/word" &&
        suggestionState === "none" &&
        inflectionResults === undefined && (
          <button
            type="button"
            className={`btn btn-outline-secondary bg-white entry-suggestion-button${
              state.options.searchBarPosition === "bottom"
                ? " entry-suggestion-button-with-bottom-searchbar"
                : ""
            }`}
            onClick={startSuggestion}
            title="create entry suggestion"
          >
            <i className="fas fa-plus" style={{ padding: "3px" }} />
          </button>
        )}
      {inflectionResults === undefined &&
        suggestionState === "none" &&
        window.location.pathname === "/search" && (
          <button
            type="button"
            className={`btn btn-outline-secondary bg-white conjugation-search-button${
              state.options.searchBarPosition === "bottom"
                ? " conjugation-search-button-with-bottom-searchbar"
                : ""
            }`}
            onClick={handleInflectionSearch}
            title="search in inflections/conjugations"
          >
            <i className={inflectionSearchIcon} style={{ padding: "3px" }} />
          </button>
        )}
      {inflectionResults === "searching" && (
        <div>
          <p className="lead mt-1">
            Searching conjugations/inflections...{" "}
            <i className="fas fa-hourglass-half" />
          </p>
        </div>
      )}
      {inflectionResults && inflectionResults !== "searching" && (
        <div>
          <h4 className="mt-1 mb-3">Conjugation/Inflection Results</h4>
          {inflectionResults.exact.length === 0 &&
            inflectionResults.fuzzy.length === 0 && (
              <div className="mt-4">
                <div>
                  No conjugation/inflection matches found for{" "}
                  <strong>{state.searchValue}</strong>
                </div>
              </div>
            )}
          {(["exact", "fuzzy"] as ("exact" | "fuzzy")[]).map((t) => {
            return inflectionResults[t].length !== 0 ? (
              <>
                <h5 className="mb-3">
                  {t === "exact" ? "Exact" : "Approximate"} Matches
                </h5>
                {inflectionResults[t].map((p) => (
                  <div key={p.entry.ts}>
                    <Entry
                      key={p.entry.i}
                      entry={p.entry}
                      textOptions={textOptions}
                      isolateEntry={isolateEntry}
                      admin={admin}
                    />
                    <div className="mb-3 ml-2">
                      {p.forms.map((form, i) => (
                        <InflectionFormMatchDisplay
                          key={`inf-form${i}`}
                          textOptions={textOptions}
                          form={form}
                          entry={p.entry}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : null;
          })}
        </div>
      )}
      {inflectionResults === undefined && suggestionState === "none" && (
        <dl>
          {state.results.map((entry) => (
            <Entry
              key={entry.i}
              entry={entry}
              textOptions={textOptions}
              isolateEntry={isolateEntry}
              admin={admin}
            />
          ))}
        </dl>
      )}
      {state.user && suggestionState === "editing" && (
        <div className="my-3">
          <h5 className="mb-3">Suggest an entry for the dictionary:</h5>
          <div className="form-group mt-4" style={{ maxWidth: "500px" }}>
            <div className="row mb-2">
              <div className="col">
                <label htmlFor="suggestionPashto">Pashto:</label>
                <input
                  type="text"
                  className="form-control"
                  dir="rtl"
                  id="suggestionPashto"
                  data-lpignore="true"
                  value={pashto}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  onChange={(e) => setPashto(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="suggestionPhonetics">Phonetics:</label>
                <input
                  type="text"
                  className="form-control"
                  dir="ltr"
                  id="suggestionPhonetics"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  data-lpignore="true"
                  value={phonetics}
                  onChange={(e) => setPhonetics(e.target.value)}
                />
              </div>
            </div>
            <label htmlFor="suggestionEnglish">English:</label>
            <input
              type="text"
              className="form-control mb-2"
              id="suggestionEnglish"
              data-lpignore="true"
              value={english}
              autoComplete="off"
              onChange={(e) => setEnglish(e.target.value)}
            />
            <label htmlFor="editSuggestionForm">Comments:</label>
            <input
              type="text"
              className="form-control"
              id="editSuggestionForm"
              data-lpignore="true"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary mr-3"
            onClick={submitSuggestion}
            data-testid="editWordSubmitButton"
          >
            Submit
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={cancelSuggestion}
            data-testid="editWordCancelButton"
          >
            Cancel
          </button>
        </div>
      )}
      {suggestionState === "received" && (
        <div className="my-3">Thanks for the help!</div>
      )}
      {inflectionResults === undefined &&
        suggestionState === "none" &&
        state.searchValue &&
        !state.results.length && (
          <div>
            <h5 className="mt-2">
              No Results Found in {state.options.language}
            </h5>
            {state.options.language === "Pashto" && (
              <p className="mt-3">
                Click on the <i className={inflectionSearchIcon} /> to search
                inflections and conjugations
              </p>
            )}
            {state.options.searchType === "alphabetical" && (
              <div className="mt-4 font-weight-light">
                <div className="mb-3">
                  You are using alphabetical browsing mode
                </div>
                <div>
                  Click on the <span className="fa fa-book"></span> icon above
                  for smart search <span className="fa fa-bolt"></span>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default Results;
