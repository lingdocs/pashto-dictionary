/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
    ButtonSelect,
    Types as T,
} from "@lingdocs/ps-react";
import { Helmet } from "react-helmet";
import { wordlistEnabled } from "../lib/level-management";
import {
    State,
    Options,
    PTextSize,
    SearchBarPosition,
    Theme,
    OptionsAction,
    TextOptionsAction,
} from "../types/dictionary-types";
import { inflectionSearchIcon } from "./Results";

const fontSizeOptions: {
    label: string,
    value: PTextSize,
}[] = [
    { 
        label: "Normal", value: "normal",
    },
    { 
        label: "Larger", value: "larger",
    },
    { 
        label: "Largest", value: "largest",
    }
];

const themeOptions: {
    label: any,
    value: Theme,
}[] = [
    {
        label: <><i className="fa fa-sun"></i> Light</>,
        value: "light",
    },
    {
        label: <><i className="fa fa-moon"></i> Dark</>,
        value: "dark",
    },
];

const spellingOptions: {
    label: string,
    value: T.Spelling,
}[] = [
    {
        label: "Afghan",
        value: "Afghan",
    },
    {
        label: "Pakistani ي",
        value: "Pakistani ي",
    },
    {
        label: "Pakistani ی",
        value: "Pakistani ی",
    },
];

const searchBarPositionOptions: {
    label: string,
    value: SearchBarPosition,
}[] = [
    {
        label: "Top",
        value: "top",
    },
    {
        label: "Bottom",
        value: "bottom",
    },
];

// const phoneticsOptions: {
//     label: string,
//     value: Phonetics
// }[] = [
//     {
//         label: "LingDocs Phonetics",
//         value: "lingdocs",
//     },
//     {
//         label: "IPA",
//         value: "ipa",
//     },
//     {
//         label: "ALA-LC (Adapted)",
//         value: "alalc",
//     },
//     {
//         label: "None",
//         value: "none",
//     },
// ];

// const dialectOptions: {
//     label: string,
//     value: Dialect,
// }[] = [
//     {
//         label: "Standard Afghan",
//         value: "standard",
//     },
//     {
//         label: "Yousufzai (Peshawer)",
//         value: "peshawer",
//     },
//     {
//         label: "Southern",
//         value: "southern",
//     },
// ];

const booleanOptions: {
    label: string,
    value: "true" | "false",
}[] = [
    {
        label: "On",
        value: "true",
    },
    {
        label: "Off",
        value: "false",
    },
];

function OptionsScreen({
    options,
    state,
    optionsDispatch,
    textOptionsDispatch,
}: {
    options: Options,
    state: State,
    optionsDispatch: (action: OptionsAction) => void,
    textOptionsDispatch: (action: TextOptionsAction) => void,
}) {
    return <div style={{ maxWidth: "700px", marginBottom: "150px" }}>
        <Helmet>
            <link rel="canonical" href="https://dictionary.lingdocs.com/settings" />
            <meta name="description" content="Settings for the LingDocs Pashto Dictionary" />
            <title>Settings - LingDocs Pashto Dictionary</title>
        </Helmet>
        <h2 className="mb-3">Settings</h2>
        <h4 className="mb-3">Keyboard Shortucts</h4>
        <table className="table">
            <tbody>
                <tr>
                    <td><kbd>ctrl / ⌘</kbd> + <kbd>up</kbd> / <kbd>down</kbd></td>
                    <td>switch language</td>
                </tr>
                <tr>
                    <td><kbd>shift</kbd> + <kbd>space</kbd></td>
                    <td>put cursor in search bar</td>
                </tr>
                <tr>
                    <td><kbd>ctrl / ⌘</kbd> + <kbd>i</kbd></td>
                    <td>search inflections/conjugations <i className={inflectionSearchIcon} /></td>
                </tr>
                <tr>
                    <td><kbd>ctrl / ⌘</kbd> + <kbd>b</kbd></td>
                    <td>clear search</td>
                </tr>
                <tr>
                    <td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> ... <kbd>9</kbd></td>
                    <td>Select word result 1-9 from the top</td>
                </tr>
                {wordlistEnabled(state.user) && <>
                    <tr>
                        <td><kbd>ctrl / ⌘</kbd> + <kbd>s</kbd></td>
                        <td>add word to wordlist <i className="far fa-star" /></td>
                    </tr>
                    <tr>
                        <td><kbd>ctrl / ⌘</kbd> + <kbd>\</kbd></td>
                        <td>show/hide wordlist</td>
                    </tr>
                </>}
            </tbody>
        </table>
        <h4 className="mt-3">Theme</h4>
        <ButtonSelect
            small
            options={themeOptions}
            value={options.theme}
            handleChange={(p) => optionsDispatch({ type: "changeTheme", payload: p as Theme })}
        />
        <h4 className="mt-3">Sticky Focus on Search Bar</h4>
        <div className="mb-2 small">Keep the cursor active on the search bar even if you click other parts of the app.</div>
        <ButtonSelect
            small
            options={booleanOptions}
            value={options.searchBarStickyFocus.toString()}
            handleChange={(p) => optionsDispatch({ type: "changeSearchBarStickyFocus", payload: p === "true" })}
        />
        <h4 className="mt-3">Search Bar Position</h4>
        <ButtonSelect
            small
            options={searchBarPositionOptions}
            value={options.searchBarPosition}
            handleChange={(p) => optionsDispatch({ type: "changeSearchBarPosition", payload: p as SearchBarPosition })}
        />
        <div className="small mt-2">Bottom position doesn't work well with iPhones.</div>
        {wordlistEnabled(state.user) && <>
            <h4 className="mt-3">Show Number of Wordlist Words for Review</h4>
            <ButtonSelect
                small
                options={booleanOptions}
                value={options.wordlistReviewBadge.toString()}
                handleChange={(p) => optionsDispatch({ type: "changeWordlistReviewBadge", payload: p === "true" })}
            />
        </>}
        <h4 className="mt-3">Pashto Font Size</h4>
        <ButtonSelect
            small
            options={fontSizeOptions}
            value={options.textOptionsRecord.textOptions.pTextSize}
            handleChange={(p) => textOptionsDispatch({ type: "changePTextSize", payload: p as PTextSize })}
        />
        <h4 className="mt-3">Diacritics</h4>
        <ButtonSelect
            small
            options={booleanOptions}
            value={options.textOptionsRecord.textOptions.diacritics.toString()}
            handleChange={(p) => textOptionsDispatch({ type: "changeDiacritics", payload: p === "true" })}
        />
        <h4 className="mt-3">Pashto Spelling</h4>
        <ButtonSelect
            small
            options={spellingOptions}
            value={options.textOptionsRecord.textOptions.spelling}
            handleChange={(p) => textOptionsDispatch({ type: "changeSpelling", payload: p as T.Spelling })}
        />
        {/* NEED TO UPDATE THE PHONETICS DIALECT OPTION THING */}
        {/* <h4 className="mt-3">Phonetics</h4>
        <ButtonSelect
            small
            options={phoneticsOptions}
            value={options.textOptions.phonetics}
            handleChange={(p) => optionsDispatch({ type: "changePhonetics", payload: p as Phonetics })}
        /> */}
        {/* <div className="mt-2 small">
            {options.textOptions.phonetics === "lingdocs"
                ? "Searchable, typeable with a regular keyboard, universal across all dialects"
                : options.textOptions.phonetics === "none"
                ? ""
                : "Not searchable, display will depend on dialect"
            }
        </div> */}
        {/* {(options.textOptions.phonetics === "ipa" || options.textOptions.phonetics === "alalc") &&
            <>
                <h4 className="mt-3">Dialect for Phonetics</h4>
                <ButtonSelect
                    small
                    options={dialectOptions}
                    value={options.textOptions.dialect}
                    handleChange={(p) => optionsDispatch({ type: "changeDialect", payload: p as Dialect })}
                />
            </>
        } */}
    </div>
}

export default OptionsScreen;