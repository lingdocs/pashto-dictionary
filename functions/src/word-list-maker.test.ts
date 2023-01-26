import {
    psHash,
    dePsHash,
    PsHash,
} from "./word-list-maker";
import {
    Types as T,
} from "@lingdocs/inflect";

const toTest: {
    plain: T.PsWord,
    hash: PsHash,
}[] = [
    {
        plain: { p: "کور", f: "kor" },
        hash: "کورXkor",
    },
    {
        plain: {
            p: "کنار", f: "kanaar",
            hyphen: [
                { type: "unwritten", f: "e" },
                { type: "written", f: "daryaab", p: "دریاب" },
            ],
        },
        hash: "کنارXkanaar-Xe-دریابXdaryaab",
    },
    {
        plain: {
            p: "کار", f: "kaar",
            hyphen: [
                { type: "written", f: "U", p: "و" },
                { type: "written", f: "baar", p: "بار" },
            ],
        },
        hash: "کارXkaar-وXU-بارXbaar",
    },
];

test("psHash should work", () => {
    toTest.forEach((t) => {
        expect(psHash(t.plain)).toEqual(t.hash);
    });
});

test("dePsHash should work", () => {
    toTest.forEach((t) => {
        expect(dePsHash(t.hash)).toEqual(t.plain);
    });
});
