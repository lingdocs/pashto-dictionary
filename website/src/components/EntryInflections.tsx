import {
  InflectionsTable,
  inflectWord,
  Types as T,
  getInflectionPattern,
  HumanReadableInflectionPattern,
} from "@lingdocs/ps-react";

export default function EntryInflections({
  entry,
  opts,
}: {
  entry: T.DictionaryEntry;
  opts: T.TextOptions;
}) {
  const inf = ((): T.InflectorOutput | false | "error" => {
    try {
      return inflectWord(entry);
    } catch (e) {
      console.error("error inflecting entry", entry);
      return "error";
    }
  })();
  if (inf === "error") {
    return <h4>Error inflecting word!</h4>;
  }
  if (!inf || !inf.inflections) {
    return null;
  }
  return (
    <>
      {inf.inflections &&
        (() => {
          const pattern = getInflectionPattern(
            // @ts-ignore
            entry
          );
          return (
            <div>
              <a
                href={`https://grammar.lingdocs.com/inflection/inflection-patterns/${inflectionSubUrl(
                  pattern
                )}`}
                rel="noreferrer"
                target="_blank"
              >
                <div className="badge bg-light mb-2">
                  Inflection pattern{" "}
                  {HumanReadableInflectionPattern(pattern, opts)}
                </div>
              </a>
              <InflectionsTable inf={inf.inflections} textOptions={opts} />
            </div>
          );
        })()}
      {"plural" in inf && inf.plural !== undefined && (
        <div>
          <h5>Plural</h5>
          <InflectionsTable inf={inf.plural} textOptions={opts} />
        </div>
      )}
      {"vocative" in inf && inf.vocative !== undefined && (
        <div>
          <h5>Vocative</h5>
          <InflectionsTable inf={inf.vocative} vocative textOptions={opts} />
        </div>
      )}
      {"bundledPlural" in inf && inf.bundledPlural !== undefined && (
        <div>
          <h5>Bundled Plural</h5>
          <InflectionsTable inf={inf.bundledPlural} textOptions={opts} />
        </div>
      )}
      {"arabicPlural" in inf && inf.arabicPlural !== undefined && (
        <div>
          <h5>Arabic Plural</h5>
          <InflectionsTable inf={inf.arabicPlural} textOptions={opts} />
        </div>
      )}
    </>
  );
}

function inflectionSubUrl(pattern: T.InflectionPattern): string {
  return pattern === 0
    ? ""
    : pattern === 1
    ? "#1-basic"
    : pattern === 2
    ? "#2-words-ending-in-an-unstressed-ی---ey"
    : pattern === 3
    ? "#3-words-ending-in-a-stressed-ی---éy"
    : pattern === 4
    ? "#4-words-with-the-pashtoon-pattern"
    : pattern === 5
    ? "#5-shorter-words-that-squish"
    : // : pattern === 6
      "#6-inanimate-feminine-nouns-ending-in-ي---ee";
}
