import {
    entryFeeder,
} from "../lib/dictionary";
import {
    State,
} from "../types/dictionary-types";
import {
    VPExplorer,
    EPExplorer,
    EntrySelect,
    useStickyState,
    ButtonSelect,
    Types as T,
} from "@lingdocs/ps-react";
import { getTextOptions } from "../lib/get-text-options";
import { useEffect } from "react";


function PhraseBuilder({ state, isolateEntry }: {
    state: State,
    isolateEntry: (ts: number) => void,
}) {
    const [type, setType] = useStickyState<"EP" | "VP">("VP", "phraseBuilderType");
    const [entry, setEntry] = useStickyState<T.VerbEntry | undefined>(
        undefined,
        "vEntrySelect",
    );
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const vp = params.get("vp");
        const ep = params.get("ep");
        if (vp) {
            setType("VP");
        } else if (ep) {
            setType("EP");
        }
    }, [setType]);
    return <div style={{ maxWidth: "1250px", margin: "0 auto 200px auto" }}>
        <h2>Phrase Builder</h2>
        <div className="text-center mb-3 mt-3">
            <ButtonSelect
                options={[
                    { label: "Verb Phrase", value: "VP" },
                    { label: "Equative Phrase", value: "EP" },
                ]}
                value={type}
                handleChange={setType}
            />
        </div>
        {type === "EP" ? <div>
            <h3 className="mb-4">Equative Phrase Builder</h3>
            <EPExplorer
                opts={getTextOptions(state)}
                entryFeeder={entryFeeder}
            />
        </div>
        : <div>
            <h3 className="mb-4">Verb Phrase Builder</h3>
            <div style={{ maxWidth: "300px" }}>
                <div className="h5">Verb:</div>
                <EntrySelect
                    value={entry}
                    onChange={setEntry}
                    entryFeeder={entryFeeder.verbs}
                    opts={getTextOptions(state)}
                    isVerbSelect
                    name="Verb"
                />
            </div>
            <div style={{ margin: "0 auto" }}>
                {entry
                    ? <VPExplorer
                        verb={entry}
                        opts={getTextOptions(state)}
                        entryFeeder={entryFeeder}
                        handleLinkClick={isolateEntry}
                    />
                    : <div className="lead">
                        Choose a verb to start building
                    </div>}
            </div>
        </div>}
    </div>

}

export default PhraseBuilder;