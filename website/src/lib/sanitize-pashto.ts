/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { standardizePashto } from "@lingdocs/pashto-inflector";

export default function sanitizePashto(input: string): string {
    return standardizePashto(input.trim())
        .replace(/v/g, "w")
        // remove diacritics as well
        .replace(/[\u0600-\u061e\u064c-\u0670\u06D6-\u06Ed]/g, "");
        // TODO: What to do with \u0674 ??
}
