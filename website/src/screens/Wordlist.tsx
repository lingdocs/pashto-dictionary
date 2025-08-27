/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import Entry from "../components/Entry";
import * as AT from "../types/account-types";
import WordlistWordEditor from "../components/WordlistWordEditor";
import { useState, useEffect } from "react";
import Helmet from "react-helmet";
import {
  deleteWordFromWordlist,
  updateWordlistWord,
  getWordlistCsv,
  searchWordlist,
  calculateWordsToDelete,
  hasAttachment,
} from "../lib/wordlist-database";
import { ButtonSelect, InlinePs, removeFVarients } from "@lingdocs/ps-react";
import { Modal, Button } from "react-bootstrap";
import WordlistImage from "../components/WordlistImage";
import ReviewScoreInput from "../components/ReviewScoreInput";
import { isPashtoScript } from "../lib/is-pashto";
import {
  forReview,
  nextUpForReview,
  practiceWord,
} from "../lib/spaced-repetition";
import { pageSize } from "../lib/dictionary";
import { textBadge } from "../lib/badges";
import { SuperMemoGrade } from "supermemo";
import AudioPlayButton from "../components/AudioPlayButton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import hitBottom from "../lib/hitBottom";
import { Link } from "react-router-dom";
import {
  Options,
  WordlistWord,
  Language,
  OptionsAction,
  WordlistMode,
} from "../types/dictionary-types";
import UpgradePrices from "../components/UpgradePrices";

const cleanupIcon = "broom";

dayjs.extend(relativeTime);

const reviewLanguageOptions: {
  label: string;
  value: Language;
}[] = [
    {
      label: "Pashto",
      value: "Pashto",
    },
    {
      label: "English",
      value: "English",
    },
  ];

function paginate<T>(arr: T[], page: number): T[] {
  return arr.slice(0, page * pageSize);
}

function amountOfWords(number: number): string {
  if (number === 0) {
    return "ALL your words";
  }
  return `${number} word${number !== 1 ? "s" : ""}`;
}

let popupRef: Window | null = null;

function Wordlist({
  options,
  wordlist,
  isolateEntry,
  optionsDispatch,
  user,
  loadUser,
}: {
  options: Options;
  wordlist: WordlistWord[];
  isolateEntry: (ts: number) => void;
  optionsDispatch: (action: OptionsAction) => void;
  user: AT.LingdocsUser | undefined;
  loadUser: () => void;
}) {
  // @ts-ignore
  const [wordOpen, setWordOpen] = useState<string | undefined>(undefined);
  const [wordQuizzing, setWordQuizzing] = useState<string | undefined>(
    undefined
  );
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [showingDownload, setShowingDownload] = useState<boolean>(false);
  const [wordlistDownloadSort, setWordlistDownloadSort] = useState<
    "alphabetical" | "time"
  >("time");
  const [page, setPage] = useState<number>(1);
  const [wordlistSearchValue, setWordlistSearchValue] = useState<string>("");
  const [filteredWords, setFilteredWords] = useState<WordlistWord[]>([]);
  const [showingCleanup, setShowingCleanup] = useState<boolean>(false);
  const [monthsBackToKeep, setMonthsBackToKeep] = useState<number>(6);
  const [wordsToDelete, setWordsToDelete] = useState<string[]>([]);
  const [startedWithWordsToReview] = useState<boolean>(
    forReview(wordlist).length !== 0
  );
  useEffect(() => {
    window.addEventListener("message", handleIncomingMessage);
    return () => {
      window.removeEventListener("message", handleIncomingMessage);
    };
    // eslint-disable-next-line
  }, []);
  const admin = !!user?.admin;
  // TODO put the account url in an imported constant
  function handleIncomingMessage(event: MessageEvent<any>) {
    if (
      event.origin === "https://account.lingdocs.com" &&
      event.data === "signed in" &&
      popupRef
    ) {
      loadUser();
      popupRef.close();
    }
  }
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line
  }, []);
  const toReview = forReview(wordlist);
  const textOptions = options.textOptionsRecord.textOptions;
  function handleScroll() {
    // TODO: DON'T HAVE ENDLESS PAGE INCREASING
    if (hitBottom() && options.wordlistMode === "browse") {
      setPage((page) => page + 1);
    }
  }
  function handleWordClickBrowse(id: string) {
    setWordOpen(id === wordOpen ? undefined : id);
  }
  function handleWordClickReview(id: string) {
    setWordQuizzing(id === wordQuizzing ? undefined : id);
  }
  function deleteWord(id: string) {
    deleteWordFromWordlist(id);
  }
  function handleAnswer(word: WordlistWord, grade: SuperMemoGrade) {
    setWordQuizzing(undefined);
    setShowGuide(false);
    updateWordlistWord(practiceWord(word, grade));
  }
  function handleSearchValueChange(value: string) {
    setWordlistSearchValue(value);
    const results = value ? searchWordlist(value, wordlist, textOptions) : [];
    setFilteredWords(results);
  }
  async function handleGetWordlistCSV() {
    const blob = await getWordlistCsv(wordlistDownloadSort);
    setShowingDownload(false);
    var a = document.createElement("a");
    document.body.appendChild(a);
    // @ts-ignore
    a.style = "display: none";
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = "wordlist.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }
  function handleShowCleanup() {
    setWordsToDelete(calculateWordsToDelete(wordlist, monthsBackToKeep));
    setShowingCleanup(true);
  }
  function handleCloseCleanup() {
    setShowingCleanup(false);
    setWordsToDelete([]);
  }
  function handleCleanup() {
    const toDelete = calculateWordsToDelete(wordlist, monthsBackToKeep);
    deleteWordFromWordlist(toDelete);
    setShowingCleanup(false);
  }
  function handleOpenSignup() {
    popupRef = window.open(
      "https://account.lingdocs.com",
      "account",
      "height=800,width=500,top=50,left=400"
    );
  }
  function WordlistBrowsingWord({ word }: { word: WordlistWord }) {
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    return (
      <div className="mb-4">
        <Entry
          admin={admin}
          entry={word.entry}
          textOptions={textOptions}
          isolateEntry={() => handleWordClickBrowse(word._id)}
        />
        {hasAttachment(word, "audio") && <AudioPlayButton word={word} />}
        {word._id === wordOpen ? (
          <>
            <div className="mb-3 d-flex flex-row justify-content-between">
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => isolateEntry(word.entry.ts)}
                >
                  <i className="fas fa-book" />
                  {` `}View Entry
                </button>
              </div>
              <div>
                {!confirmDelete ? (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <i className="fas fa-trash" />
                    {` `}Delete
                  </button>
                ) : (
                  <div>
                    <button
                      className="btn mr-2 btn-sm btn-outline-secondary"
                      onClick={() => setConfirmDelete(false)}
                    >
                      <i className="fas fa-times" />
                      {` `}Cancel
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteWord(word._id)}
                    >
                      <i className="fas fa-check" />
                      {` `}Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            {Date.now() < word.dueDate && (
              <div className="text-muted small text-center mt-2 mb-1">
                up for review {dayjs().to(dayjs(word.dueDate))}
              </div>
            )}
            {/* possible "next review" in x days, mins etc. calculated from milliseconds */}
            <WordlistWordEditor word={word} />
          </>
        ) : (
          word.notes && (
            <div
              className="clickable text-muted mb-3"
              onClick={() => handleWordClickBrowse(word._id)}
              dir="auto"
              style={{
                textAlign: isPashtoScript(word.notes[0]) ? "right" : "left",
              }}
            >
              {word.notes}
            </div>
          )
        )}
        {hasAttachment(word, "image") && word._id !== wordOpen && (
          <WordlistImage word={word} />
        )}
      </div>
    );
  }
  function WordlistReviewWord({ word }: { word: WordlistWord }) {
    const beingQuizzed = word._id === wordQuizzing;
    return (
      <div className="mb-4">
        <div
          className="card mb-3 clickable"
          onClick={() => handleWordClickReview(word._id)}
        >
          <div className="card-body">
            <h6 className="card-title text-center">
              {options.wordlistReviewLanguage === "Pashto" ? (
                <InlinePs
                  opts={textOptions}
                  ps={{ p: word.entry.p, f: word.entry.f }}
                />
              ) : (
                word.entry.e
              )}
            </h6>
            {beingQuizzed && (
              <div className="card-text text-center">
                {options.wordlistReviewLanguage === "Pashto" ? (
                  <div>{word.entry.e}</div>
                ) : (
                  <InlinePs
                    opts={textOptions}
                    ps={{ p: word.entry.p, f: word.entry.f }}
                  />
                )}
                <div className="text-muted mb-2">{word.notes}</div>
                {hasAttachment(word, "audio") && (
                  <AudioPlayButton word={word} />
                )}
                {hasAttachment(word, "image") && <WordlistImage word={word} />}
              </div>
            )}
          </div>
        </div>
        {beingQuizzed && (
          <ReviewScoreInput
            handleGrade={(grade) => handleAnswer(word, grade)}
            guide={showGuide}
          />
        )}
      </div>
    );
  }
  if (!user || user.level === "basic") {
    return (
      <div className="width-limiter" style={{ marginBottom: "120px" }}>
        <Helmet>
          <title>Wordlist - LingDocs Pashto Dictionary</title>
        </Helmet>
        <div className="d-flex flex-row justify-content-between mb-2">
          <h4 className="mb-3">Wordlist</h4>
        </div>
        <div style={{ marginTop: "2rem" }}>
          {!user ? (
            <p className="lead">
              <Link to="/account">Sign in</Link> to upgrade and enable wordlist
            </p>
          ) : (
            <p className="lead">
              Upgrade to a <strong>student account</strong> to enable the
              wordlist
            </p>
          )}
          <div>
            <p>Features:</p>
            <ul>
              <li>Save your wordlist and sync across devices</li>
              <li>Save text, audio, or visual context for words</li>
              <li>Review words with Anki-style spaced repetition</li>
            </ul>
            {!user ? (
              <>
                <p>Cost:</p>
                <ul>
                  <li>$1/month or $10/year - cancel any time</li>
                </ul>
              </>
            ) : (
              <UpgradePrices source="wordlist" />
            )}
            {!user && (
              <button
                className="btn btn-lg btn-primary my-4"
                onClick={handleOpenSignup}
              >
                <i className="fas fa-sign-in-alt mr-2" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="width-limiter" style={{ marginBottom: "120px" }}>
      <Helmet>
        <title>Wordlist - LingDocs Pashto Dictionary</title>
      </Helmet>
      <div className="d-flex flex-row justify-content-between mb-2">
        <h4 className="mb-3">Wordlist</h4>
        {wordlist.length > 0 && (
          <div className="d-flex flex-row justify-content-between mb-2">
            <div>
              <button
                className="btn btn-sm btn-outline-secondary mr-3"
                onClick={handleShowCleanup}
              >
                <i className={`fas fa-${cleanupIcon} mx-1`} />{" "}
                <span className="show-on-desktop">Cleanup</span>
              </button>
            </div>
            <div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowingDownload(true)}
              >
                <i className="fas fa-download mx-1" />{" "}
                <span className="show-on-desktop">CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {!wordlist.length ? (
        <EmptyWordlistNotice />
      ) : (
        <>
          <div className="mb-3 text-center">
            <ButtonSelect
              options={[
                {
                  label: "Browse",
                  value: "browse",
                },
                {
                  label: "Review" + textBadge(toReview.length),
                  value: "review",
                },
              ]}
              value={options.wordlistMode || "browse"}
              handleChange={(p) => {
                optionsDispatch({
                  type: "changeWordlistMode",
                  payload: p as WordlistMode,
                });
              }}
            />
          </div>
          {options.wordlistMode === "browse" ? (
            <div className="mt-4">
              <WordlistSearchBar
                value={wordlistSearchValue}
                handleChange={handleSearchValueChange}
              />
              {paginate(
                wordlistSearchValue ? filteredWords : wordlist,
                page
              ).map((word) => (
                <WordlistBrowsingWord word={word} key={word._id} />
              ))}
            </div>
          ) : (
            <div>
              <div className="mb-2 text-center">Show:</div>
              <div className="mb-4 text-center" style={{ width: "100%" }}>
                <ButtonSelect
                  options={reviewLanguageOptions}
                  value={options.wordlistReviewLanguage || "Pashto"}
                  handleChange={(p) => {
                    optionsDispatch({
                      type: "changeWordlistReviewLanguage",
                      payload: p as Language,
                    });
                  }}
                />
              </div>
              <div>
                {/* TODO: ISSUE WITH NOT USING PAGINATE HERE BECAUSE OF IMAGE RELOADING BUGINESS WHEN HITTING BOTTOM */}
                {toReview.length === 0 ? (
                  startedWithWordsToReview ? (
                    <p className="lead my-3">All done review 🎉</p>
                  ) : (
                    (() => {
                      const nextUp = nextUpForReview(wordlist);
                      const { e, ...ps } = nextUp.entry;
                      return (
                        <div>
                          <div className="lead my-3">None to review</div>
                          <p>
                            Next word up for review{" "}
                            <strong>{dayjs().to(nextUp.dueDate)}</strong>:{" "}
                            <InlinePs
                              opts={textOptions}
                              ps={removeFVarients(ps)}
                            />
                          </p>
                        </div>
                      );
                    })()
                  )
                ) : (
                  toReview.map((word) => (
                    <WordlistReviewWord word={word} key={word._id} />
                  ))
                )}
              </div>
            </div>
          )}
          {wordlistSearchValue && filteredWords.length === 0 && (
            <div>
              <h6 className="my-4 ml-1">None found</h6>
            </div>
          )}
        </>
      )}
      <Modal show={showingDownload} onHide={() => setShowingDownload(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-download mr-1`} /> Download Wordlist CSV
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You can download your wordlist in CSV format. Then you can open it
            with a spreadsheet program or import it into Anki. Pictures will not
            be included.
          </p>
          <p>How should we sort your wordlist?</p>
          <ButtonSelect
            options={[
              {
                label: "Alphabetically",
                value: "alphabetical",
              },
              {
                label: "By Date Added",
                value: "time",
              },
            ]}
            value={wordlistDownloadSort}
            handleChange={(p) => {
              setWordlistDownloadSort(p as "alphabetical" | "time");
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowingDownload(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleGetWordlistCSV()}>
            <i className="fas fa-download mr-1" /> Download CSV
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showingCleanup} onHide={handleCloseCleanup}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${cleanupIcon} mr-1`} /> Wordlist Cleanup
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You have {amountOfWords(wordlist.length)} in your wordlist.</p>
          <p>Delete:</p>
          <ButtonSelect
            options={[
              {
                label: "Older than 1 Month",
                value: "1",
              },
              {
                label: "Older than 6 Months",
                value: "6",
              },
              {
                label: "Older than 1 Year",
                value: "12",
              },
              {
                label: "ALL words",
                value: "0",
              },
            ]}
            value={monthsBackToKeep.toString()}
            handleChange={(p: string) => {
              const months = parseInt(p);
              setWordsToDelete(calculateWordsToDelete(wordlist, months));
              setMonthsBackToKeep(months);
            }}
          />
          <p className="mt-3">
            This will delete {amountOfWords(wordsToDelete.length)}.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCleanup}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleCleanup}
            disabled={wordsToDelete.length === 0}
          >
            <i className={`fas fa-${cleanupIcon} mr-1`} /> Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function EmptyWordlistNotice() {
  return (
    <div className="pt-4">
      <p>Your wordlist is empty.</p>
      <p>
        To add a word to your wordlist, choose a word while searching and click
        on the <i className="far fa-star" /> icon.
      </p>
    </div>
  );
}

function WordlistSearchBar({
  handleChange,
  value,
}: {
  value: string;
  handleChange: (value: string) => void;
}) {
  return (
    <div className="input-group mb-3">
      <input
        type="text"
        style={{ borderRight: "0px", zIndex: 200 }}
        placeholder={"search wordlist"}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        name="search"
        className="form-control py-2 border-right-0 border"
        autoFocus={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        dir="auto"
        data-testid="wordlistSearchInput"
        data-lpignore="true"
      />
      <span className="input-group-append">
        <span
          className="btn btn-outline-secondary clear-search-button border-left-0 border"
          onClick={() => handleChange("")}
          data-testid="wordlistClearButton"
        >
          <i
            className="fa fa-times"
            style={!value ? { visibility: "hidden" } : {}}
          ></i>
        </span>
      </span>
    </div>
  );
}

export default Wordlist;
