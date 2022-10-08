import { Types as IT } from "@lingdocs/ps-react";
import {
  Options,
  OptionsAction,
  TextOptionsAction,
} from "../types/dictionary-types";

export function optionsReducer(options: Options, action: OptionsAction): Options {
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
    if (action.type === "updateTextOptionsRecord") {
      return {
        ...options,
        textOptionsRecord: action.payload,
      };
    }
    if (action.type === "changeSearchBarStickyFocus") {
      return {
        ...options,
        searchBarStickyFocus: action.payload,
      }
    }
    throw new Error("action type not recognized in options reducer");
}

export function textOptionsReducer(textOptions: IT.TextOptions, action: TextOptionsAction): IT.TextOptions {
  if (action.type === "changePTextSize") {
    return {
      ...textOptions,
      pTextSize: action.payload,
    };
  }
  if (action.type === "changeSpelling") {
    return {
      ...textOptions,
      spelling: action.payload,
    };
  }
  if (action.type === "changePhonetics") {
    return {
      ...textOptions,
      phonetics: action.payload,
    };
  }
  if (action.type === "changeDialect") {
    return {
      ...textOptions,
      dialect: action.payload,
    };
  }
  if (action.type === "changeDiacritics") {
    return {
      ...textOptions,
      diacritics: action.payload,
    };
  }
  throw new Error("action type not recognized in text options reducer");
}
