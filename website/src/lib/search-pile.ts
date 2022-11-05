/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Types as T } from "@lingdocs/ps-react";
import {
    isVerbBlock,
    isImperativeBlock,
    isInflectionSet,
    isPluralInflectionSet,
} from "@lingdocs/ps-react";
import { personFromVerbBlockPos } from "@lingdocs/ps-react";
import {
    InflectionName,
    PluralInflectionName,
    InflectionFormMatch,
} from "../types/dictionary-types";

const inflectionNames: { inflections: InflectionName[], plural: PluralInflectionName[] } = {
    inflections: ["plain", "1st", "2nd"],
    plural: ["plural", "2nd"],
};

type ObPile = { [key: string]: ObRec; }
type ObRec = T.VerbBlock | T.ImperativeBlock | T.InflectionSet | T.PsString | boolean | null | string | ObPile;

type SinglePsResult = T.PsString | null;
type BlockResult = { ps: T.PsString, pos: T.Person[] | InflectionName[] }[];
type InflectionSetResult = { ps: T.PsString, pos: (InflectionName | PluralInflectionName)[] }[];
type BlockResultRaw = { ps: T.PsString, pos: [number, number][] }[];
type RowResult = { ps: T.PsString, pos: (0 | 1)[] }[];

function isPsString(x: T.PsString | ObPile): x is T.PsString {
    return (
        "p" in x &&
        "f" in x &&
        typeof x.p === "string"
    );
}

function isBlockResult(x: InflectionFormMatch[] | BlockResult): x is BlockResult {
    return "ps" in x[0];
}

// NOTE: perfectiveSplit needs to be ignored because the [PsString, PsString] structure breaks the search!
const defaultFieldsToIgnore = ["info", "type", "perfectiveSplit"];

export function searchPile(pile: ObPile, searchFun: (s: T.PsString) => boolean, toIgnore: string[] = []): InflectionFormMatch[] {
    const fieldsToIgnore = [...defaultFieldsToIgnore, toIgnore];

    function searchObRecord(record: ObRec): null | BlockResult | SinglePsResult | InflectionFormMatch[] {
        // hit a bottom part a tree, see if what we're looking for is there
        if (Array.isArray(record)) {
            // @ts-ignore
            return searchBlock(record, searchFun);
        }
        if (typeof record !== "object") return null;
        if (!record) return null;
        if (isPsString(record)) {
            const res = searchFun(record);
            return res ? record : null;  
        }
        // look further down the tree recursively
        return searchPile(record, searchFun);
    }

    return Object.entries(pile).reduce((res: InflectionFormMatch[], entry): InflectionFormMatch[] => {
        const [name, value] = entry;
        if (fieldsToIgnore.includes(name)) {
            return res;
        }
        const result = searchObRecord(value);
        // Result: Hit the bottom and nothing found
        if (result === null || result === undefined) {
            return res;
        }
        // Result: Hit a PsString with what we want at the bottom
        if ("p" in result) {
            return [
                ...res,
                {
                    path: [name],
                    matches: [{ ps: result, pos: null }],
                },
            ];
        }
        if (result.length === 0) {
            return res;
        }
        // Result: Hit the bottom and found a Verb or Inflection block with what we want at the bottom
        if (isBlockResult(result)) {
            return [
                ...res,
                {
                    path: [name],
                    matches: result,
                }
            ];
        }
        // Result: Have to keep looking down recursively
        // add in the current path to all the results
        const rb: InflectionFormMatch[] = [
            ...res,
            ...result.map((r) => ({
                ...r,
                path: [name, ...r.path]
            })),
        ]
        return rb;
    }, []);
}

function searchBlock(block: T.VerbBlock | T.ImperativeBlock | T.InflectionSet, searchFun: (x: T.PsString) => boolean): null | BlockResult | InflectionSetResult {
    if (isVerbBlock(block)) {
        const results = searchVerbBlock(block, searchFun);
        if (results.length) {
            return results.map((result) => ({
                ...result,
                pos: result.pos.map(x => personFromVerbBlockPos(x)),
            }));
        }
        return null;
    }
    if (isInflectionSet(block)) {
        const results = searchInflectionSet(block, searchFun, "inflections");
        if (results.length) {
            return results;
        }
        return null;
    }
    if (isPluralInflectionSet(block)) {
        const results = searchInflectionSet(block, searchFun, "plural");
        if (results.length) {
            return results;
        }
        return null;
    }
    if (isImperativeBlock(block)) {
        const results = searchVerbBlock(block, searchFun);
        if (results.length) {
            return results.map((result) => ({
                ...result,
                pos: result.pos.map(x => personFromVerbBlockPos([x[0] + 2, x[1]])),
            }));
        }
        return null;
    }
    return null;
}

export function searchRow(row: T.PersonLine, searchFun: (ps: T.PsString) => boolean): RowResult {
    return row.reduce((all: RowResult, col, h): RowResult => {
        const i = h as 0 | 1;
        const inCol = col.filter(searchFun);
        inCol.forEach((ps) => {
            const index = all.findIndex((x) => x.ps.f === ps.f);
            if (index === -1) {
                all.push({ ps, pos: [i] });
            } else {
                if (!all[index].pos.includes(i)) {
                    all[index].pos = [...all[index].pos, i];
                }
            }
        });
        return all;
    }, []);
}

export function searchVerbBlock(vb: T.VerbBlock | T.ImperativeBlock, searchFun: (ps: T.PsString) => boolean): BlockResultRaw {
    return vb.reduce((all: BlockResultRaw, row, i): BlockResultRaw => {
        const rowResults = searchRow(row, searchFun);
        const prev = [...all];
        rowResults.forEach(r => {
            const index = prev.findIndex(x => x.ps.f === r.ps.f);
            if (index !== -1) {
                const toAdd = r.pos.map((c): [number, number] => [i, c])
                prev[index].pos.push(...toAdd)
            } else {
                prev.push({
                    ps: r.ps,
                    pos: r.pos.map((col): [number, number] => [i, col]),
                });
            }
        });
        return prev;
    }, []);
}

function searchInflectionSet(inf: T.InflectionSet | T.PluralInflectionSet, searchFun: (ps: T.PsString) => boolean, type: "inflections" | "plural"): InflectionSetResult {
    return inf.reduce((all: InflectionSetResult, item, i): InflectionSetResult => {
        const matching = item.filter(searchFun);
        if (i === 0) {
            return matching.map(ps => ({ ps, pos: [inflectionNames[type][i]] }))
        }
        matching.forEach(it => {
            const index = all.findIndex(x => x.ps.f === it.f);
            if (index !== -1) {
                all[index].pos.push(inflectionNames[type][i])
            } else {
                all.push({ ps: it, pos: [inflectionNames[type][i]] });
            }
        })
        return all;
    }, []);
}
