/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import { State } from "../types/dictionary-types";
import { Link } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

const About = ({ state }: { state: State }) => {
  return (
    <div className="width-limiter">
      <Helmet>
        <link rel="canonical" href="https://dictionary.lingdocs.com/about" />
        <meta
          name="description"
          content="About the LingDocs Pashto Dictionary"
        />
        <title>About - LingDocs Pashto Dictionary</title>
      </Helmet>
      <h2>About</h2>
      <p>
        The <strong>LingDocs Pashto Dictionary</strong> aims to make an easily
        searchable and accessible dictionary of the Pashto Language, along with
        its inflections and verb conjugations.
      </p>
      <h3>Features</h3>
      <ul>
        <li>Approximate search-as-you-type</li>
        <li>Alphabetical browsing</li>
        <li>Pashto Audio Recordings</li>
        <li>Inflections and Verb Conjugations</li>
        <li>Phrase Generation Engine</li>
        <li>Ability to suggest additions or corrections (with sign-in)</li>
        <li>Choice of spelling/phonetic systems</li>
        <li>...and more</li>
      </ul>
      <h3>Video Introduction</h3>
      <VideoPlayer url="https://www.youtube.com/watch?v=MMpSpaMMdp4&t=1s&ab_channel=LingDocs" />
      <h3>Install as an App</h3>
      <p>
        After visiting this dictionary for the first time it will be accessible
        from your browser even without an internet connection. You can also
        {` `}
        <strong>install it as an app</strong> on your phone or desktop by
        choosing "Add to Home Screen" on "Install" on your browser menu.
      </p>
      <h3>Phonetic System</h3>
      <p>
        This dictionary (and the{" "}
        <a href="https://grammar.lingdocs.com">grammar</a> that goes along with
        it) uses a{" "}
        <a href="https://grammar.lingdocs.com/writing/phonetics/">
          special phonetic system
        </a>{" "}
        for writing the Pashto words in Latin letters, showing the pronunciation
        the vowels. This has been designed to allow people to write and search
        words <em>without needing to type an special characters</em>.
      </p>
      <h3>Inspiration and Sources</h3>
      <p>
        This dictionary is grateful for and indebted to the excellent work
        available at <a href="https://qamosona.com/">qamosona.com</a>,{" "}
        <a href="https://www.wiktionary.org/">wiktionary.org</a>, and{" "}
        <a href="https://translate.google.com/">Google Translate</a>. These
        sources were used extensively as a reference for definitions.
      </p>
      <p>
        Currently this dictionary contains{" "}
        {state.dictionaryInfo
          ? state.dictionaryInfo.numberOfEntries
          : "about 15,000"}{" "}
        entries. It is nowhere near as comprehensive or accurate as some of
        these other sources, but it does strive to present something uniquely
        accesible to learners through offline web-app availability,
        inflection/conjugation/phrase-building engine, and smart searching
        algorithms.
      </p>
      <h3>Contact</h3>
      <p>Feedback and suggestions are appreciated.</p>
      <ul>
        <li>
          Twitter: <a href="https://twitter.com/@lingdocs">@lingdocs</a>
        </li>
        <li>
          Reddit: <a href="https://reddit.com/r/lingdocs">/r/lingdocs</a>
        </li>
        <li>
          YouTube:{" "}
          <a href="https://www.youtube.com/channel/UC1-yjDec5VDtia5s1gcMw4A">
            LingDocs YouTube Channel
          </a>
        </li>
        <li>Email: dev234 AT lingdocs DOT com</li>
      </ul>
      <p>
        Or show your support through{" "}
        <a href="https://www.buymeacoffee.com/lingdocsdev">buymeacoffee</a>
      </p>
      <h3>License and Legal Info</h3>
      <h4>Source Code</h4>
      <p>
        This dictionary app is open sounce. The code is available{" "}
        <a href="https://github.com/lingdocs/pashto-dictionary">
          here on GitHub
        </a>{" "}
        and is licensed under a GPLv3 License.
      </p>
      <h4>Dictionary Content</h4>
      <p>
        The contents of this dictionary are licensed under a{" "}
        <a
          rel="license"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
        >
          Creative Commons Creative Commons Attribution-NonCommercial-ShareAlike
          4.0 International License
        </a>
        , with the added stipulation that this material cannot be used or
        re-distributed by any people or groups involved with military, violence,
        or government intelligence work.
      </p>
      <p>
        The LingDocs Pashto Dictionary assumes no responsibility or liability
        for any errors or omissions in the content of this site. The information
        contained in this site is provided on an “as is” basis with no
        guarantees of completeness, accuracy, usefulness or timeliness.
      </p>
      <p>
        <Link to="/privacy">Privacy Policy</Link>
      </p>
      <p>
        © Copyright 2023 - <a href="https://www.lingdocs.com/">lingdocs.com</a>
      </p>
      {state.dictionaryInfo && (
        <p className="text-muted">
          Number of Entries: {state.dictionaryInfo.numberOfEntries} - Updated:{" "}
          {dayjs(state.dictionaryInfo.release).toString()}
        </p>
      )}
      {import.meta.env.VITE_BUILD_NO && (
        <p className="small text-muted">
          App build number: {import.meta.env.VITE_BUILD_NO}
        </p>
      )}
    </div>
  );
};

export default About;
