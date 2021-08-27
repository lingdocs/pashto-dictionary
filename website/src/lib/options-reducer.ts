import { Types as IT } from "@lingdocs/pashto-inflector";
import * as AT from "../types/account-types";

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

export function removePTextSize(textOptions: IT.TextOptions): AT.UserTextOptions {
  const { pTextSize, ...userTextOptions } = textOptions;
  return userTextOptions;
}

export function resolveTextOptions(userOnServer: AT.LingdocsUser, prevUser: AT.LingdocsUser | undefined, localTextOptionsRecord: TextOptionsRecord): { userTextOptionsRecord: AT.UserTextOptionsRecord, serverOptionsAreNewer: boolean } {
  const isANewUser = !prevUser || (userOnServer.userId !== prevUser.userId);
  if (isANewUser) {
    // take the new user's text options, if the have any
    // if not just take the equivalent of the user text options from the saved record 
    return userOnServer.userTextOptionsRecord
      ? {
        serverOptionsAreNewer: true,
        userTextOptionsRecord: userOnServer.userTextOptionsRecord,
      }
      : {
          serverOptionsAreNewer: false,
          userTextOptionsRecord: {
            lastModified: localTextOptionsRecord.lastModified,
            userTextOptions: removePTextSize(localTextOptionsRecord.textOptions),
          }
      };
  }
  // if the new user is the same as the existing user that we had
  const serverOptionsAreNewer = !!(userOnServer.userTextOptionsRecord && (userOnServer.userTextOptionsRecord.lastModified > localTextOptionsRecord.lastModified));
  return {
    serverOptionsAreNewer,
    userTextOptionsRecord: (serverOptionsAreNewer && userOnServer.userTextOptionsRecord)
      ? userOnServer.userTextOptionsRecord
      : {
        lastModified: localTextOptionsRecord.lastModified,
        userTextOptions: removePTextSize(localTextOptionsRecord.textOptions),
      },
  };
}
