import { Types as T } from "@lingdocs/pashto-inflector";

export function getTextOptions(state: State): T.TextOptions {
    return state.options.textOptionsRecord.textOptions; 
}