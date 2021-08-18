/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function wordlistEnabled(state: State | UserLevel): boolean {
    const level = (typeof state === "string")
        ? state
        : state.options.level;
    return level !== "basic";
}
