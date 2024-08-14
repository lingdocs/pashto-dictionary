/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { inflectWord, Types, InlinePs } from "@lingdocs/ps-react";
import {
  isAdjectiveEntry,
  isNounEntry,
} from "@lingdocs/ps-react/dist/lib/src/type-predicates";

const InflectionsInfo = ({
  entry,
  textOptions,
}: {
  entry: Types.DictionaryEntry;
  textOptions: Types.TextOptions;
}) => {
  if (!isNounEntry(entry) && !isAdjectiveEntry(entry)) {
    return null;
  }
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
  if (inf.inflections) {
    // TODO: would be nice if inflection pattern number was in the inflections object
    return (
      <div className="entry-extra-info" data-testid="inflections-info">
        <InflectionsPreview inf={inf.inflections} opts={textOptions} />
      </div>
    );
  }
  // shouldn't happen, but in case there are special inflections info on a feminine noun
  return null;
};

function InflectionsPreview({
  inf,
  opts,
}: {
  inf: Types.Inflections;
  opts: Types.TextOptions;
}) {
  return (
    <div className="small">
      {"masc" in inf && (
        <span className="mr-2">
          <InlinePs opts={opts} ps={inf.masc[1][0]} />
        </span>
      )}
      {"fem" in inf && <InlinePs opts={opts} ps={inf.fem[1][0]} />}
    </div>
  );
}

const ArabicPluralInfo = ({
  entry,
  textOptions,
}: {
  entry: Types.DictionaryEntry;
  textOptions: Types.TextOptions;
}) => {
  if (!(entry.app && entry.apf)) {
    return null;
  }
  return (
    <div className="entry-extra-info">
      Arabic Plural:{" "}
      <InlinePs
        opts={textOptions}
        ps={{
          p: entry.app,
          f: entry.apf,
        }}
      />
    </div>
  );
};

const PresentFormInfo = ({
  entry,
  textOptions,
}: {
  entry: Types.DictionaryEntry;
  textOptions: Types.TextOptions;
}) => {
  /* istanbul ignore next */
  if (!(entry.psp && entry.psf)) {
    return null;
  }
  return (
    <div className="entry-extra-info">
      Imperfective Stem:{" "}
      <InlinePs
        opts={textOptions}
        ps={{
          p: `${entry.psp}ي`,
          f: `${entry.psf}ee`,
        }}
      />
    </div>
  );
};

const PashtoPluralInfo = ({
  entry,
  textOptions,
}: {
  entry: Types.DictionaryEntry;
  textOptions: Types.TextOptions;
}) => {
  if (!(entry.ppp && entry.ppf)) {
    return null;
  }
  return (
    <div className="entry-extra-info">
      Plural:{" "}
      <InlinePs
        opts={textOptions}
        ps={{
          p: entry.ppp,
          f: entry.ppf,
        }}
      />
    </div>
  );
};

// TODO: refactor this in a better way
const ExtraEntryInfo = ({
  entry,
  textOptions,
}: {
  entry: Types.DictionaryEntry;
  textOptions: Types.TextOptions;
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
