/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SearchBar = ({ state, optionsDispatch, handleSearchValueChange, onBottom }: {
  state: State
  optionsDispatch: (action: OptionsAction) => void,
  handleSearchValueChange: (searchValue: string) => void,
  onBottom?: boolean,
}) => {
  const LanguageToggle = ({ language }: { language: Language }) => {
    const arrowDirection = language === "Pashto" ? "right" : "left";
    return (
      <button
        className="btn btn-outline-secondary"
        onClick={() => optionsDispatch({ type: "toggleLanguage" })}
        data-testid="languageToggle"
      >
        <div aria-label={`language-choice-${language === "Pashto" ? "ps-to-en" : "en-to-ps"}`}>
          Ps <span className={`fa fa-arrow-${arrowDirection}`} ></span> En
        </div>
      </button>
    );
  }
  const SearchTypeToggle = ({ searchType }: { searchType: SearchType }) => {
    const icon = (searchType === "alphabetical") ? "book" : "bolt";
    return (
        <button
            className="btn btn-outline-secondary"
            onClick={() => optionsDispatch({ type: "toggleSearchType" })}
            data-testid="searchTypeToggle"
        >
            <span className={`fa fa-${icon}`} ></span>
        </button>
    );
  };

  const placeholder = (state.options.searchType === "alphabetical" && state.options.language === "Pashto") 
    ? "Browse alphabetically"
    : `Search ${state.options.language === "Pashto" ? "Pashto" : "English"}`;
  return (
    <nav className={`navbar bg-light${!onBottom ? " fixed-top" : ""}`} style={{ zIndex: 50, width: "100%" }}>
      <div className="form-inline my-1 my-lg-1">
        <div className="input-group">
          <input
            type="text"
            style={{ borderRight: "0px", zIndex: 200 }}
            placeholder={placeholder}
            value={state.searchValue}
            onChange={(e) => handleSearchValueChange(e.target.value)}
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
          />
          <span className="input-group-append">
            <span
              className={`btn btn-outline-secondary${!state.searchValue ? " unclickable" : ""} clear-search-button border-left-0 border`}
              style={{ borderRadius: 0 }}
              onClick={state.searchValue ? () => handleSearchValueChange("") : () => null}
              data-testid="clearButton"
            >
              <i className="fa fa-times" style={!state.searchValue ? { visibility: "hidden" } : {}}></i>
            </span>
          </span>
          <div className="input-group-append">
            {state.options.language === "Pashto" &&
              <SearchTypeToggle
                searchType={state.options.searchType}
              />
            }
            {<LanguageToggle
              language={state.options.language}
            />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SearchBar;