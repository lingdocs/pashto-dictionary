/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as AT from "./account-types";

export const optionsLocalStorageName = "options2";
export const userLocalStorageName = "user1";

export function saveOptions(options: Options): void {
  localStorage.setItem(optionsLocalStorageName, JSON.stringify(options));
};

export const readOptions = (): Options | undefined => {
  const optionsRaw = localStorage.getItem(optionsLocalStorageName);
  if (!optionsRaw) {
    return undefined;
  }
  try {
    const options = JSON.parse(optionsRaw) as Options;
    // check for new options here
    if (options.wordlistReviewBadge === undefined) {
      options.wordlistReviewBadge = true;
    }
    if (options.searchBarPosition === undefined) {
      options.searchBarPosition = "top";
    }
    return options;
  } catch (e) {
    console.error("error parsing saved state JSON", e);
    return undefined;
  }
};

export function saveUser(user: AT.LingdocsUser | undefined): void {
  if (user) {
    localStorage.setItem(userLocalStorageName, JSON.stringify(user));
  } else {
    localStorage.removeItem(userLocalStorageName);
  }
};

export const readUser = (): AT.LingdocsUser | undefined => {
    const userRaw = localStorage.getItem(userLocalStorageName);
    if (!userRaw) {
        return undefined;
    }
    try {
        const user = JSON.parse(userRaw) as AT.LingdocsUser;
        return user;
    } catch (e) {
        console.error("error parsing saved user JSON", e);
        return undefined;
    }
};