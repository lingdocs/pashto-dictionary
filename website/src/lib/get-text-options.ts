import { Types as T } from "@lingdocs/ps-react";
import {
    State,
} from "../types/dictionary-types";

export function getTextOptions(state: State): T.TextOptions {
    return state.options.textOptionsRecord.textOptions; 
}