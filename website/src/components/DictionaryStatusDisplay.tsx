/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DictionaryStatus } from "../types/dictionary-types";

function DictionaryStatusDisplay({ status }: { status: DictionaryStatus }) {
    if (status === "loading" || status === "updating") {
        return (
            <div className="mt-4">
                <h4 className="text-center" data-testid="loading-notice">
                    {status === "loading" ? "Loading" : "Updating"}...
                </h4>
                <div className="loader"></div>
            </div>
        );
    } else if (status === "error loading") {
        return (
            <div className="text-center mt-4">
                <h4 className="mb-4">Error Loading Dictionary</h4>
                <p>Please check your internet connection and reload this page</p>
            </div>
        );
    } else {
        return null;
    }
};

export default DictionaryStatusDisplay;
