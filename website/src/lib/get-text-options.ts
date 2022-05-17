import { Types as T } from "@lingdocs/pashto-inflector";
import {
    State,
} from "../types/dictionary-types";

export function getTextOptions(state: State): T.TextOptions {
    return state.options.textOptionsRecord.textOptions; 
}