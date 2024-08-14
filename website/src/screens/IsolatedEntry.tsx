/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import {
  VPExplorer,
  InlinePs,
  Types as T,
  typePredicates as tp,
} from "@lingdocs/ps-react";
import { submissionBase, addSubmission } from "../lib/submissions";
import { Link } from "react-router-dom";
import Entry from "../components/Entry";
import Results from "../screens/Results";
import WordlistWordEditor from "../components/WordlistWordEditor";
import {
  addToWordlist,
  deleteWordFromWordlist,
  hasAttachment,
} from "../lib/wordlist-database";
import { wordlistEnabled } from "../lib/level-management";
import AudioPlayButton from "../components/AudioPlayButton";
import { Helmet } from "react-helmet";
import { Modal } from "react-bootstrap";
import { getTextOptions } from "../lib/get-text-options";
import { entryFeeder } from "../lib/dictionary";
import { State, DictionaryAPI } from "../types/dictionary-types";
import { EntryAudioDisplay } from "../components/EntryAudioDisplay";
import EntryInflections from "../components/EntryInflections";
import { ErrorBoundary } from "react-error-boundary";

function IsolatedEntry({
  state,
  dictionary,
  isolateEntry,
}: {
  state: State;
  dictionary: DictionaryAPI;
  isolateEntry: (ts: number) => void;
}) {
  const [exploded, setExploded] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");
  const [editSubmitted, setEditSubmitted] = useState<boolean>(false);
  const [showingDeleteWarning, setShowingDeleteWarning] =
    useState<boolean>(false);
  const [showClipped, setShowClipped] = useState<string>("");
  useEffect(() => {
    setEditing(false);
    setComment("");
    setEditSubmitted(false);
  }, [state]);
  function flashClippedMessage(m: string) {
    setShowClipped(m);
    setTimeout(() => {
      setShowClipped("");
    }, 1250);
  }
  const wordlistWord = state.wordlist.find(
    (w) => w.entry.ts === state.isolatedEntry?.ts
  );
  const textOptions = getTextOptions(state);
  function submitEdit() {
    if (!state.isolatedEntry) return;
    if (!state.user) return;
    addSubmission(
      {
        ...submissionBase(state.user),
        type: "edit suggestion",
        entry: state.isolatedEntry,
        comment,
      },
      state.user
    );
    setEditing(false);
    setComment("");
    setEditSubmitted(true);
  }
  function handleAddToWordlist() {
    if (!state.isolatedEntry) return;
    const toAdd = {
      entry: state.isolatedEntry,
      notes: "",
    };
    addToWordlist(toAdd);
  }
  function handleDeleteFromWordlist() {
    if (!state.isolatedEntry) return;
    if (!wordlistWord) return;
    setShowingDeleteWarning(false);
    deleteWordFromWordlist(wordlistWord._id);
  }
  const entry = state.isolatedEntry;
  if (!entry) {
    return (
      <div className="text-center">
        <h4 className="mb-4 mt-4">Word not found</h4>
        <h5>
          <Link to="/">Home</Link>
        </h5>
      </div>
    );
  }
  const complement = entry.l ? dictionary.findOneByTs(entry.l) : undefined;
  const relatedEntries = dictionary.findRelatedEntries(entry);
  const isVerbEntry = tp.isVerbEntry({ entry, complement });
  function handleClipId() {
    if (!entry) return;
    navigator.clipboard.writeText(entry.ts.toString());
    flashClippedMessage("word id copied to clipboard");
  }
  function handleClipEntry() {
    if (!entry) return;
    navigator.clipboard.writeText(JSON.stringify(entry));
    flashClippedMessage("entry data copied to clipboard");
  }
  return (
    <div className="wide-width-limiter">
      <Helmet>
        <title>{entry.p} | LingDocs Pashto Dictionary</title>
        <link
          rel="canonical"
          href={`https://dictionary.lingdocs.com/word?id=${entry.ts}`}
        />
      </Helmet>
      <dl className="row mb-1">
        <div className="col-8">
          <Entry
            admin={!!state.user?.admin}
            nonClickable
            entry={exploded ? explodeEntry(entry) : entry}
            textOptions={textOptions}
            isolateEntry={isolateEntry}
          />
        </div>
        <div className="col-4">
          <div className="d-flex flex-row justify-content-end">
            <div
              className="clickable mr-3"
              onClick={() => setExploded((os) => !os)}
              title="separate letters"
            >
              <i className={`fas fa-${exploded ? "compress" : "expand"}-alt`} />
            </div>
            <div
              className="clickable mr-3"
              onClick={handleClipId}
              title="copy word id"
            >
              <i className="fas fa-tag"></i>
            </div>
            {state.user && state.user.level === "editor" && (
              <>
                <div
                  className="clickable mr-3"
                  onClick={handleClipEntry}
                  title="copy entry data"
                >
                  <i className="fas fa-code"></i>
                </div>
                <Link to={`/edit?id=${entry.ts}`} className="plain-link">
                  <div
                    className="clickable mr-3"
                    data-testid="finalEditEntryButton"
                    title="edit entry"
                  >
                    <i className="fa fa-gavel" />
                  </div>
                </Link>
              </>
            )}
            {state.user && (
              <>
                <div
                  className="clickable mr-3"
                  data-testid="editEntryButton"
                  onClick={() => setEditing((os) => !os)}
                  title="suggest edit"
                >
                  <i className="fa fa-pen" />
                </div>
                {wordlistEnabled(state.user) && (
                  <div
                    className="clickable"
                    title="add to wordlist"
                    data-testid={
                      wordlistWord ? "fullStarButton" : "emptyStarButton"
                    }
                    onClick={
                      wordlistWord
                        ? () => setShowingDeleteWarning(true)
                        : () => handleAddToWordlist()
                    }
                  >
                    <i
                      className={`fa${wordlistWord ? "s" : "r"} fa-star fa-lg`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </dl>
      <EntryAudioDisplay entry={entry} opts={textOptions} />
      {wordlistWord && (
        <>
          {hasAttachment(wordlistWord, "audio") && (
            <AudioPlayButton word={wordlistWord} />
          )}
          <WordlistWordEditor word={wordlistWord} />
        </>
      )}
      {editing && (
        <div className="mb-3">
          <div className="form-group" style={{ maxWidth: "500px" }}>
            <label htmlFor="editSuggestionForm">Suggest correction/edit:</label>
            <input
              type="text"
              className="form-control"
              id="editSuggestionForm"
              data-lpignore="true"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={comment ? submitEdit : () => null}
              data-testid="editWordSubmitButton"
            >
              Submit
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setEditing(false);
                setComment("");
              }}
              data-testid="editWordCancelButton"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {editSubmitted && <p>Thank you for your help!</p>}
      <EntryInflections entry={entry} opts={textOptions} />
      {isVerbEntry && (
        <div className="pb-4">
          <ErrorBoundary
            fallback={
              <h5>Sorry, we weren't able to conjugate this verb! 😔</h5>
            }
          >
            <VPExplorer
              verb={{
                entry: entry as T.VerbDictionaryEntry,
                complement,
              }}
              opts={textOptions}
              entryFeeder={entryFeeder}
              handleLinkClick={isolateEntry}
            />
          </ErrorBoundary>
        </div>
      )}
      {showClipped && (
        <div
          className="alert alert-primary text-center"
          role="alert"
          style={{
            position: "fixed",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999999999999,
          }}
        >
          {showClipped}
        </div>
      )}

      {!!(relatedEntries && relatedEntries.length) ? (
        <>
          <h4 style={{ marginTop: isVerbEntry ? "10rem" : "5rem" }}>
            Related Words
          </h4>
          <Results
            state={{ ...state, results: relatedEntries }}
            isolateEntry={isolateEntry}
            handleInflectionSearch={() => null}
            relatedResults
          />
        </>
      ) : (
        <div style={{ height: "500px" }} />
      )}
      <Modal
        show={showingDeleteWarning}
        onHide={() => setShowingDeleteWarning(false)}
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete from wordlist?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <InlinePs opts={textOptions} ps={{ p: entry.p, f: entry.f }} />{" "}
          from your wordlist?
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secorndary clb"
            onClick={() => setShowingDeleteWarning(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirmDeleteFromWordlist"
            className="btn btn-primary clb"
            onClick={handleDeleteFromWordlist}
          >
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function explodeEntry(entry: T.DictionaryEntry): T.DictionaryEntry {
  return {
    ...entry,
    p: entry.p.split("").join(" "),
  };
}

export default IsolatedEntry;
