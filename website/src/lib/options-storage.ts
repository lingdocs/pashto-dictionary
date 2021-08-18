/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const optionsLocalStorageName = "options2";

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