/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import Mousetrap from "mousetrap";
import { useEffect, useRef } from "react";
import { State } from "../types/dictionary-types";
import { OptionsAction, Language, SearchType } from "../types/dictionary-types";
import { isMobile } from "../lib/detect-mobile";

const SearchBar = ({
  state,
  optionsDispatch,
  handleSearchValueChange,
  onBottom,
}: {
  state: State;
  optionsDispatch: (action: OptionsAction) => void;
  handleSearchValueChange: (searchValue: string) => void;
  onBottom?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    window.addEventListener("focus", onFocus);
    Mousetrap.bind(["shift+space"], (e) => {
      e.preventDefault();
      if (e.repeat) {
        return;
      }
      inputRef.current?.focus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
      Mousetrap.unbind(["shift+space"]);
    };
    // eslint-disable-next-line
  }, []);
  function onFocus() {
    if (["/", "/search"].includes(window.location.pathname)) {
      inputRef.current?.focus();
    }
  }
  const LanguageToggle = ({ language }: { language: Language }) => {
    const arrowDirection = language === "Pashto" ? "right" : "left";
    return (
      <button
        className="btn btn-outline-secondary"
        onClick={() => optionsDispatch({ type: "toggleLanguage" })}
        data-testid="languageToggle"
      >
        <div
          aria-label={`language-choice-${
            language === "Pashto" ? "ps-to-en" : "en-to-ps"
          }`}
        >
          Ps <span className={`fa fa-arrow-${arrowDirection}`} /> En
        </div>
      </button>
    );
  };
  const SearchTypeToggle = ({ searchType }: { searchType: SearchType }) => {
    const icon = searchType === "alphabetical" ? "book" : "bolt";
    return (
      <button
        className="btn btn-outline-secondary"
        onClick={() => optionsDispatch({ type: "toggleSearchType" })}
        data-testid="searchTypeToggle"
        title="toggle alphabetical/smart search"
      >
        <span className={`fa fa-${icon}`} />
      </button>
    );
  };

  const placeholder =
    state.options.searchType === "alphabetical" &&
    state.options.language === "Pashto"
      ? "Browse alphabetically"
      : `Search ${state.options.language === "Pashto" ? "Pashto" : "English"}`;
  return (
    <nav
      className={`navbar bg-light${onBottom ? "" : " fixed-top"}`}
      style={{ zIndex: 50, width: "100%" }}
    >
      <div className="form-inline my-1 my-lg-1">
        <div className="input-group">
          <input
            type="text"
            style={{ borderRight: "0px", zIndex: 200 }}
            placeholder={placeholder}
            value={state.searchValue}
            onChange={(e) => {
              handleSearchValueChange(e.target.value);
            }}
            onBlur={(e) => {
              // don't loose focus/cursor if clicking on a word/star etc if searchBarStickyFocus is enabled
              if (
                state.options.searchBarStickyFocus &&
                !isMobile &&
                e.relatedTarget === null
              ) {
                e.target.focus();
              }
            }}
            name="search"
            className="form-control py-2 border-right-0 border"
            autoFocus={true}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            dir="auto"
            data-testid="searchInput"
            data-lpignore="true"
            ref={inputRef}
          />
          <span className="input-group-append">
            <span
              className={`btn btn-outline-secondary${
                !state.searchValue ? " unclickable" : " clickable"
              } clear-search-button border-left-0 border`}
              style={{ borderRadius: 0 }}
              onClick={
                state.searchValue
                  ? () => {
                      handleSearchValueChange("");
                      // keep the focus on the input after pressing the X
                      inputRef.current && inputRef.current.focus();
                    }
                  : undefined
              }
              data-testid="clearButton"
              title="clear search"
            >
              <i
                className="fa fa-times"
                style={!state.searchValue ? { visibility: "hidden" } : {}}
              ></i>
            </span>
          </span>
          <div className="input-group-append" title="toggle search language">
            {state.options.language === "Pashto" && (
              <SearchTypeToggle searchType={state.options.searchType} />
            )}
            {<LanguageToggle language={state.options.language} />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SearchBar;
