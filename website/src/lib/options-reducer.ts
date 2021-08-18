function optionsReducer(options: Options, action: OptionsAction): Options {
    if (action.type === "toggleLanguage") {
      return {
        ...options,
        language: options.language === "Pashto" ? "English" : "Pashto",
      };
    }
    if (action.type === "toggleSearchType") {
      return {
        ...options,
        searchType: options.searchType === "alphabetical" ? "fuzzy" : "alphabetical",
      }
    }
    if (action.type === "changeTheme") {
      return {
        ...options,
        theme: action.payload,
      };
    }
    if (action.type === "changeSearchBarPosition") {
      return {
        ...options,
        searchBarPosition: action.payload,
      };
    }
    if (action.type === "changeUserLevel") {
      return {
        ...options,
        level: action.payload,
      };
    }
    if (action.type === "changeWordlistMode") {
      return {
        ...options,
        wordlistMode: action.payload,
      };
    }
    if (action.type === "changeWordlistReviewBadge") {
      return {
        ...options,
        wordlistReviewBadge: action.payload,
      };
    }
    if (action.type === "changeWordlistReviewLanguage") {
      return {
        ...options,
        wordlistReviewLanguage: action.payload,
      };
    }
    if (action.type === "changePTextSize") {
      return {
        ...options,
        textOptions: {
          ...options.textOptions,
          pTextSize: action.payload,
        },
      };
    }
    if (action.type === "changeSpelling") {
      return {
        ...options,
        textOptions: {
          ...options.textOptions,
          spelling: action.payload,
        }
      };
    }
    if (action.type === "changePhonetics") {
      return {
        ...options,
        textOptions: {
          ...options.textOptions,
          phonetics: action.payload,
        }
      };
    }
    if (action.type === "changeDialect") {
      return {
        ...options,
        textOptions: {
          ...options.textOptions,
          dialect: action.payload,
        }
      };
    }
    if (action.type === "changeDiacritics") {
      return {
        ...options,
        textOptions: {
          ...options.textOptions,
          diacritics: action.payload,
        }
      };
    }
    throw new Error("action type not recognized in reducer");
  }

export default optionsReducer;