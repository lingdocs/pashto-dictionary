/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState, type JSX } from "react";
import classNames from "classnames";
import { Link } from "react-router-dom";
import { VPExplorer } from "@lingdocs/ps-react";
import { entryFeeder } from "../lib/dictionary";
import {
  InflectionsTable,
  inflectWord,
  Types as T,
  InlinePs,
  validateEntry,
  typePredicates,
} from "@lingdocs/ps-react";
import Entry from "../components/Entry";
import * as FT from "../types/functions-types";
import { submissionBase, addSubmission } from "../lib/submissions";
import { Helmet } from "react-helmet";
import { TextOptions } from "@lingdocs/ps-react/dist/types";
import * as AT from "../types/account-types";
import { DictionaryAPI } from "../types/dictionary-types";
import { ErrorBoundary } from "react-error-boundary";

const textFields: { field: T.DictionaryEntryTextField; label: string }[] = [
  { field: "p", label: "Pashto" },
  { field: "f", label: "Phonetics" },
  { field: "e", label: "English" },
  { field: "c", label: "Part of Speech" },
  { field: "infap", label: "1st Masc. Irreg. Inflect. P" },
  { field: "infaf", label: "1st Masc. Irreg. Inflect. F" },
  { field: "infbp", label: "2nd Irreg. Inflect. Base P" },
  { field: "infbf", label: "2nd Irreg. Inflect. Base F" },
  { field: "app", label: "Arabic Plural P" },
  { field: "apf", label: "Arabic Plural F" },
  { field: "ppp", label: "Pashto Plural P" },
  { field: "ppf", label: "Pashto Plural F" },
  { field: "psp", label: "Imperf. Stem P" },
  { field: "psf", label: "Imperf. Stem F" },
  { field: "ssp", label: "Perf. Stem P" },
  { field: "ssf", label: "Perf. Stem F" },
  { field: "prp", label: "Perf. Root P" },
  { field: "prf", label: "Perf. Root F" },
  { field: "pprtp", label: "Past Part. P" },
  { field: "pprtf", label: "Past Part. F" },
  { field: "tppp", label: "3rd Pers. Masc. Sing P." },
  { field: "tppf", label: "3rd Pers. Masc. Sing F." },
  { field: "ec", label: "English Verb Conjugation" },
  { field: "ep", label: "English Verb Particle" },
];

const booleanFields: { field: T.DictionaryEntryBooleanField; label: string }[] =
  [
    { field: "noInf", label: "no inflection" },
    { field: "shortIntrans", label: "short intrans" },
    { field: "noOo", label: "no oo prefix" },
    { field: "sepOo", label: "sep. oo prefix" },
    { field: "diacExcept", label: "diacritics except." },
  ];

const numberFields: { field: T.DictionaryEntryNumberField; label: string }[] = [
  { field: "l", label: "link" },
  { field: "separationAtP", label: "seperation at P" },
  { field: "separationAtF", label: "seperation at F" },
];

function OneField(props: {
  value: string | number | undefined;
  field: { field: T.DictionaryEntryField; label: string | JSX.Element };
  errored?: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor={props.field.field} className="small">
        {props.field.label}
      </label>
      <input
        type="text"
        id={props.field.field}
        className={classNames("form-control", { "is-invalid": props.errored })}
        name={props.field.field}
        value={props.value ?? ""}
        dir={props.field.field.slice(-1) === "p" ? "rtl" : "ltr"}
        onChange={props.handleChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

function EntryEditor({
  isolatedEntry,
  dictionary,
  searchParams,
  textOptions,
  user,
}: {
  isolatedEntry: T.DictionaryEntry | undefined;
  textOptions: TextOptions;
  dictionary: DictionaryAPI;
  searchParams: URLSearchParams;
  user: AT.LingdocsUser | undefined;
  // removeFromSuggestions: (sTs: number) => void,
}) {
  const [entry, setEntry] = useState<T.DictionaryEntry>(
    isolatedEntry ?? { ts: 0, i: 0, p: "", f: "", g: "", e: "" }
  );
  const [matchingEntries, setMatchingEntries] = useState<T.DictionaryEntry[]>(
    isolatedEntry ? searchForMatchingEntries(isolatedEntry.p) : []
  );
  const [erroneusFields, setErroneousFields] = useState<
    T.DictionaryEntryField[]
  >([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [deleted, setDeleted] = useState<boolean>(false);
  const [willDeleteSuggestion, setWillDeleteSuggestion] =
    useState<boolean>(true);
  const comment = searchParams.get("comment");
  const sTsString = searchParams.get("sTs");
  const sTs = sTsString && sTsString !== "0" ? parseInt(sTsString) : undefined;
  const suggestedWord =
    searchParams.get("p") || searchParams.get("f")
      ? {
        p: searchParams.get("p") || "",
        f: searchParams.get("f") || "",
      }
      : undefined;
  useEffect(() => {
    setEntry(isolatedEntry ?? { ts: 1, i: 0, p: "", f: "", g: "", e: "" });
    setMatchingEntries(
      isolatedEntry ? searchForMatchingEntries(isolatedEntry.p) : []
    );
    // eslint-disable-next-line
  }, [isolatedEntry]);
  function searchForMatchingEntries(s: string): T.DictionaryEntry[] {
    return dictionary
      .exactPashtoSearch(s)
      .filter((w) => w.ts !== isolatedEntry?.ts);
  }
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    setEntry({
      ...entry,
      [name]:
        value &&
          numberFields.find((x) => x.field === name) &&
          typeof value === "string"
          ? parseInt(value)
          : value,
    });
    if (erroneusFields.length) setErroneousFields([]);
    if (name === "f" || name === "p") {
      setMatchingEntries(searchForMatchingEntries(value as string));
    }
  }
  function handleDelete() {
    if (!user) return;
    const submission: FT.EntryDeletion = {
      ...submissionBase(user),
      type: "entry deletion",
      ts: entry.ts,
    };
    addSubmission(submission, user);
    setDeleted(true);
  }
  function handleSubmit(e: any) {
    setErroneousFields([]);
    setErrors([]);
    e.preventDefault();
    if (!user) return;
    const result = validateEntry(entry);
    if ("errors" in result) {
      setErroneousFields(result.erroneousFields);
      setErrors(result.errors);
      return;
    }
    // TODO: Check complement if checkComplement
    const submission: FT.NewEntry | FT.EntryEdit = {
      ...submissionBase(user),
      type: entry.ts === 1 ? "new entry" : "entry edit",
      entry: { ...entry, ts: entry.ts === 1 ? Date.now() : entry.ts },
    };
    addSubmission(submission, user);
    setSubmitted(true);
    // TODO: Remove from suggestions
    // if (willDeleteSuggestion && sTs) {
    //     removeFromSuggestions(sTs);
    // }
  }

  const complement = entry.l ? dictionary.findOneByTs(entry.l) : undefined;
  const inf = ((): T.InflectorOutput | false => {
    try {
      return inflectWord(entry);
    } catch (e) {
      console.error("error inflecting entry", entry);
      return false;
    }
  })();
  const linkField: { field: "l"; label: string | JSX.Element } = {
    field: "l",
    label: (
      <>
        link{" "}
        {entry.l ? (
          complement ? (
            <InlinePs opts={textOptions} ps={complement} />
          ) : (
            "not found"
          )
        ) : (
          ""
        )}
      </>
    ),
  };
  return (
    <div className="width-limiter" style={{ marginBottom: "70px" }}>
      <Helmet>
        <link rel="canonical" href="https://dictionary.lingdocs.com/edit" />
        <title>Edit - LingDocs Pashto Dictionary</title>
      </Helmet>
      {isolatedEntry && (
        <Entry
          admin={!!user?.admin}
          nonClickable
          entry={isolatedEntry}
          textOptions={textOptions}
          isolateEntry={() => null}
        />
      )}
      {suggestedWord && <InlinePs opts={textOptions} ps={suggestedWord} />}
      {comment && <p>Comment: "{comment}"</p>}
      {submitted ? (
        "Edit submitted/saved"
      ) : deleted ? (
        "Entry Deleted"
      ) : (
        <div>
          {matchingEntries.length > 0 && (
            <div className="mb-1 text-center">
              <strong>Matching Entries:</strong>
              {matchingEntries.map((entry) => (
                <div key={entry.ts}>
                  <Link to={`/edit?id=${entry.ts}`} className="plain-link">
                    <InlinePs opts={textOptions} ps={entry} />
                  </Link>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col">
                {[textFields[0]].map((field) => (
                  <OneField
                    key={field.field}
                    errored={erroneusFields.includes(field.field)}
                    field={field}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
              <div className="col">
                {[textFields[1]].map((field) => (
                  <OneField
                    key={field.field}
                    field={field}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
            </div>
            {[textFields[2]].map((field) => (
              <OneField
                key={field.field}
                field={field}
                errored={erroneusFields.includes(field.field)}
                value={entry[field.field]}
                handleChange={handleInputChange}
              />
            ))}
            <div className="row">
              <div className="col">
                {[textFields[3]].map((field) => (
                  <OneField
                    key={field.field}
                    field={field}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
              <div className="col">
                {[numberFields[0]].map((field) => (
                  <OneField
                    key={field.field}
                    field={linkField}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
            </div>
            <div className="row">
              <div className="col">
                {textFields.slice(4, 13).map((field) => (
                  <OneField
                    key={field.field}
                    field={field}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
                {numberFields.slice(1).map((field) => (
                  <OneField
                    key={field.field}
                    field={field}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
              <div className="col">
                {textFields.slice(12, 23).map((field) => (
                  <OneField
                    key={field.field}
                    field={field}
                    errored={erroneusFields.includes(field.field)}
                    value={entry[field.field]}
                    handleChange={handleInputChange}
                  />
                ))}
              </div>
            </div>
            {booleanFields.map((field) => (
              <div className="form-group form-check-inline" key={field.field}>
                <input
                  id={field.field}
                  type="checkbox"
                  className={classNames("form-check-input", {
                    "is-invalid": erroneusFields.includes(field.field),
                  })}
                  name={field.field}
                  checked={entry[field.field] || false}
                  onChange={handleInputChange}
                />
                <label htmlFor={field.field} className="form-check-label">
                  {field.label}
                </label>
              </div>
            ))}
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary mr-4"
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Entry
              </button>
              {sTs && (
                <div className="ml-3 form-group form-check-inline">
                  <input
                    id={"deleteSts"}
                    type="checkbox"
                    className="form-check-input"
                    name="deleteSts"
                    checked={willDeleteSuggestion}
                    onChange={(e) => setWillDeleteSuggestion(e.target.checked)}
                  />
                  <label htmlFor="deleteSts" className="form-check-label">
                    Delete suggestion?
                  </label>
                </div>
              )}
            </div>
            {errors.length > 0 && (
              <div className="alert alert-warning">
                <ul className="mt-2">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
          {inf && inf.inflections && (
            <InflectionsTable inf={inf.inflections} textOptions={textOptions} />
          )}
          {inf && "plural" in inf && inf.plural !== undefined && (
            <InflectionsTable inf={inf.plural} textOptions={textOptions} />
          )}
          {inf && "arabicPlural" in inf && inf.arabicPlural !== undefined && (
            <InflectionsTable
              inf={inf.arabicPlural}
              textOptions={textOptions}
            />
          )}
          {/* TODO: aay tail from state options */}
          {typePredicates.isVerbEntry({ entry, complement }) && (
            <div className="pb-4">
              <ErrorBoundary fallback={<h5>Error conjugating verb</h5>}>
                <VPExplorer
                  verb={{
                    entry: entry as T.VerbDictionaryEntry,
                    complement,
                  }}
                  opts={textOptions}
                  entryFeeder={entryFeeder}
                  handleLinkClick="none"
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EntryEditor;
