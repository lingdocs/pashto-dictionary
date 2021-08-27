/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import * as FT from "../types/functions-types";
import { 
    submissionBase,
    addSubmission,
} from "../lib/submissions";
import { isPashtoScript } from "../lib/is-pashto";
import Entry from "../components/Entry";
import { Helmet } from "react-helmet";
import { allEntries } from "../lib/dictionary";
import {
    standardizePashto,
    Types as T,
    revertSpelling,
} from "@lingdocs/pashto-inflector";
import InflectionSearchResult from "../components/InflectionSearchResult";
import { searchAllInflections } from "../lib/search-all-inflections";
import { getTextOptions } from "../lib/get-text-options";

const inflectionSearchIcon = "fas fa-search-plus";

function prepValueForSearch(searchValue: string, textOptions: T.TextOptions): string {
    const s = revertSpelling(searchValue, textOptions.spelling);
    return standardizePashto(s.trim());
}

function Results({ state, isolateEntry }: {
    state: State,
    isolateEntry: (ts: number) => void,
}) {
    const [powerResults, setPowerResults] = useState<undefined | "searching" | { entry: T.DictionaryEntry, results: InflectionSearchResult[] }[]>(undefined);
    const [suggestionState, setSuggestionState] = useState<"none" | "editing" | "received">("none");
    const [comment, setComment] = useState<string>("");
    const [pashto, setPashto] = useState<string>("");
    const [phonetics, setPhonetics] = useState<string>("");
    const [english, setEnglish] = useState<string>("");
    const textOptions = getTextOptions(state);
    useEffect(() => {
        setPowerResults(undefined);
    }, [state.searchValue])
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
    function submitSuggestion(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
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
    function handlePowerSearch() {
        setPowerResults("searching");
        // need timeout to make sure the "searching" notice gets rendered before things lock up for the big search
        setTimeout(() => {
            const allDocs = allEntries();
            const results = searchAllInflections(
                allDocs,
                prepValueForSearch(state.searchValue, textOptions),
            );
            setPowerResults(results);
        }, 20);
    }
    return <div className="width-limiter">
        <Helmet>
            <title>LingDocs Pashto Dictionary</title>
        </Helmet>
        {(state.user && (window.location.pathname !== "/word") && suggestionState === "none" && powerResults === undefined) && <button
            type="button"
            className={`btn btn-outline-secondary bg-white entry-suggestion-button${state.options.searchBarPosition === "bottom" ? " entry-suggestion-button-with-bottom-searchbar" : ""}`}
            onClick={startSuggestion}
        >
            <i className="fas fa-plus" style={{ padding: "3px" }} />
        </button>}
        {(powerResults === undefined && suggestionState === "none" && window.location.pathname === "/search") && <button
            type="button"
            className={`btn btn-outline-secondary bg-white conjugation-search-button${state.options.searchBarPosition === "bottom" ? " conjugation-search-button-with-bottom-searchbar" : ""}`}
            onClick={handlePowerSearch}
        >
            <i className={inflectionSearchIcon} style={{ padding: "3px" }} />
        </button>}
        {powerResults === "searching" && <div>
            <p className="lead mt-1">Searching conjugations/inflections... <i className="fas fa-hourglass-half" /></p>
        </div>}
        {Array.isArray(powerResults) && <div>
            <h4 className="mt-1 mb-3">Conjugation/Inflection Results</h4>
            {powerResults.length === 0 && <div className="mt-4">
                <div>No conjugation/inflection matches found for <strong>{state.searchValue}</strong></div>
            </div>}
            {powerResults.map((p) => (
                <div key={p.entry.ts}>
                    <Entry
                        key={p.entry.i}
                        entry={p.entry}
                        textOptions={textOptions}
                        isolateEntry={isolateEntry}
                    />
                    <div className="mb-3 ml-2">
                        {p.results.map((result: InflectionSearchResult, i) => (
                            <InflectionSearchResult
                                key={"inf-result" + i}
                                textOptions={textOptions}
                                result={result}
                                entry={p.entry}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>}
        {powerResults === undefined && suggestionState === "none" && state.results.map((entry) => (
            <Entry
                key={entry.i}
                entry={entry}
                textOptions={textOptions}
                isolateEntry={isolateEntry}
            />
        ))}
        {(state.user && (suggestionState === "editing")) && <div className="my-3">
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
        </div>}
        {suggestionState === "received" && <div className="my-3">
                Thanks for the help!
            </div>
        }
        {(((powerResults === undefined) && suggestionState === "none" && state.searchValue && (!state.results.length))) && <div>
            <h5 className="mt-2">No Results Found in {state.options.language}</h5>
            {state.options.language === "Pashto" && isPashtoScript(state.searchValue) && <p className="mt-3">
                Click on the <i className={inflectionSearchIcon} /> to search inflections and conjugations
            </p>}
            {state.options.searchType === "alphabetical" && <div className="mt-4 font-weight-light">
                <div className="mb-3">You are using alphabetical browsing mode</div>
                <div>Click on the <span className="fa fa-book" ></span> icon above for smart search <span className="fa fa-bolt" ></span></div>
            </div>}
        </div>}
    </div>;
}

export default Results;