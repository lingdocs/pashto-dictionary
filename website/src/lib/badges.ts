/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function textBadge(number: number): string {
    return `${number ? ` (${number})` : ""}`;
}