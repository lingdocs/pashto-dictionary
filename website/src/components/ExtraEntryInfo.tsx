/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from "react";
import { inflectWord, Types, InlinePs } from "@lingdocs/pashto-inflector";

const InflectionsInfo = ({ entry, textOptions }: {
    entry: Types.DictionaryEntry,
    textOptions: Types.TextOptions,
}) => {
    const inf = ((): Types.InflectorOutput | false => {
        try {
            return inflectWord(entry);
        } catch (e) {
            console.error("error inflecting entry", entry);
            return false;
        }
    })();
    if (!inf) {
        return null;
    }
    // unisex noun / adjective
    if (inf.inflections && "masc" in inf.inflections && "fem" in inf.inflections) {
        return (
            <div className="entry-extra-info" data-testid="inflections-info">
                <InlinePs opts={textOptions}>{inf.inflections.masc[1][0]}</InlinePs>
                {` `}
                <InlinePs opts={textOptions}>{inf.inflections.fem[0][0]}</InlinePs>
            </div>
        );
    }
    // masculine noun
    if (inf.inflections && "masc" in inf.inflections) {
        return (
            <div className="entry-extra-info" data-testid="inflections-info">
                <InlinePs opts={textOptions}>{inf.inflections.masc[1][0]}</InlinePs>
            </div>
        );
    }
    // shouldn't happen, but in case there are special inflections info on a feminine noun
    return null;
};

const ArabicPluralInfo = ({ entry, textOptions }: {
    entry: Types.DictionaryEntry,
    textOptions: Types.TextOptions,
}) => {
    if (!(entry.app && entry.apf)) {
        return null;
    }
    return (
        <div className="entry-extra-info">
            Arabic Plural: <InlinePs opts={textOptions}>{{
                p: entry.app,
                f: entry.apf,
            }}</InlinePs>
        </div>
    );
};

const PresentFormInfo = ({ entry, textOptions }: {
    entry: Types.DictionaryEntry,
    textOptions: Types.TextOptions,
}) => {
    /* istanbul ignore next */
    if (!(entry.psp && entry.psf)) {
        return null;
    }
    return (
        <div className="entry-extra-info">
            Present Form: <InlinePs opts={textOptions}>{{
                p: `${entry.psp}ي`,
                f: `${entry.psf}ee`,
            }}
            </InlinePs>
        </div>
    );
};

const PashtoPluralInfo = ({ entry, textOptions }: {
    entry: Types.DictionaryEntry,
    textOptions: Types.TextOptions,
}) => {
    if (!(entry.ppp && entry.ppf)) {
        return null;
    }
    return (
        <div className="entry-extra-info">
            Plural: <InlinePs opts={textOptions}>{{
                p: entry.ppp,
                f: entry.ppf,
            }}</InlinePs>
        </div>
    );
};

// TODO: refactor this in a better way
const ExtraEntryInfo = ({ entry, textOptions }: {
    entry: Types.DictionaryEntry,
    textOptions: Types.TextOptions,
}) => {
    return (
        <>
            <InflectionsInfo entry={entry} textOptions={textOptions} />
            <ArabicPluralInfo entry={entry} textOptions={textOptions} />
            <PresentFormInfo entry={entry} textOptions={textOptions} />
            <PashtoPluralInfo entry={entry} textOptions={textOptions} />
        </>
    );
};

export default ExtraEntryInfo;
