/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FormEvent, useState } from "react";
import { Helmet } from "react-helmet";
import { scriptToPhonetics } from "../lib/scriptToPhonetics";

const preStyle: React.CSSProperties = {
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    lineHeight: "1.5",
};

const ScriptToPhonetics = () => {
    const [text, setText] = useState<string>("");
    const [result, setResult] = useState<string>("");
    function handleConversion(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setResult("Converting... Please wait...");
        setTimeout(() => {
            setResult(scriptToPhonetics(text));
        }, 50);
    }

    return <div className="width-limiter">
        <Helmet>
            <link rel="canonical" href="https://dictionary.lingdocs.com/script-to-phonetics" />
            <meta name="description" content="Convert Pashto Script to Phonetics" />
            <title>Script to Phonetics - LingDocs Pashto Dictionary</title>
        </Helmet>
        <h2>Script to Phonetics</h2>
        <form onSubmit={handleConversion}>
            <div className="form-group">
                <label htmlFor="pashto-text">Pashto Script</label>
                <textarea
                    className="form-control"
                    id="pashto-text"
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    dir="rtl"
                />
            </div>
            <div>
                <button type="submit" className="btn btn-primary">
                    <i className="fas fa-exchange-alt mr-2"/> Convert
                </button>
            </div>
            {result && <div className="mt-3">
                <label>Phonetics</label>
                <pre style={preStyle}>{result}</pre>
            </div>}
        </form>
    </div>
};

export default ScriptToPhonetics;