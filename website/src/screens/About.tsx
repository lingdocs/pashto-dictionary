/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import { State } from "../types/dictionary-types";
import { Link } from "react-router-dom";

const About = ({ state } : { state: State }) => (
    <div className="width-limiter">
        <Helmet>
            <link rel="canonical" href="https://dictionary.lingdocs.com/about" />
            <meta name="description" content="About the LingDocs Pashto Dictionary" />
            <title>About - LingDocs Pashto Dictionary</title>
        </Helmet>
        <h2>About</h2>
        <p>The <strong>LingDocs Pashto Dictionary</strong> aims to make an
        easily searchable and accessible dictionary of the Pashto Language.</p>
        <h3>Inspiration and Sources</h3>
        <p>This dictionary is grateful for and indebted to the excellent work available
        at <a href="https://qamosona.com/">qamosona.com</a>, <a href="https://www.wiktionary.org/">wiktionary.org</a>,
        and <a href="https://translate.google.com/">Google Translate</a>. These sources were used extensively as a reference for definitions.</p>
        <p>Currently this dictionary contains {state.dictionaryInfo ? state.dictionaryInfo.numberOfEntries : "about 14,000"} entries. It is nowhere near as comprehensive
        or accurate as some of these other sources, but it does strive to present something uniquely
        accesible to learners through offline web-app availability and smart searching algorithms.</p>
        <h3>License and Legal Info</h3>
        <h4>Dictionary Content</h4>
        <p>The contents of this dictionary are licensed under a <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>, with the added stipulation that this material cannot be used or re-distributed by any people or groups involved with military, violence, or government intelligence work.</p>
        {/* <h4>Dictionary Software/Code</h4>
        <p>The <a href="https://github.com/openpashto/dictionary">source code</a> of the
        dictionary web app is licensed under an <a rel="license" href="https://github.com/openpashto/pdictionary-app/blob/master/LICENSE">MIT License</a>.</p>
    <hr /> */}
        <p>The LingDocs Pashto Dictionary assumes no responsibility or liability for any errors or omissions in
        the content of this site. The information contained in this site is provided on an “as is” basis with
        no guarantees of completeness, accuracy, usefulness or timeliness.</p>
        <p><Link to="/privacy-policy">Privacy Policy</Link></p>
        <p>© Copyright 2021 - <a href="https://www.lingdocs.com/">lingdocs.com</a></p>
        {state.dictionaryInfo && <p className="text-muted">
            Number of Entries: {state.dictionaryInfo.numberOfEntries} - Updated: {dayjs(state.dictionaryInfo.release).toString()}
        </p>}
        {process.env.REACT_APP_BUILD_NO && <p className="small text-muted">App build number: {process.env.REACT_APP_BUILD_NO}</p>}
    </div>
);

export default About;
