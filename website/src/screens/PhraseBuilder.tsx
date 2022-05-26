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
    Types as T,
} from "@lingdocs/pashto-inflector";
import { getTextOptions } from "../lib/get-text-options";


function PhraseBuilder({ state, isolateEntry }: {
    state: State,
    isolateEntry: (ts: number) => void,
}) {
    const [entry, setEntry] = useStickyState<T.VerbEntry | undefined>(undefined, "vEntrySelect");
    return <div style={{ maxWidth: "1250px", margin: "0 auto 200px auto" }}>
        <h3 className="mb-4">Equative Phrase Builder</h3>
        <EPExplorer
            opts={getTextOptions(state)}
            entryFeeder={entryFeeder}
        />
        <h3 style={{ marginTop: "10rem" }}>Verb Phrase Builder</h3>
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
    </div>

}

export default PhraseBuilder;