/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext } from "react";

// @ts-ignore
export default createContext<React.Dispatch<Action>>(null);