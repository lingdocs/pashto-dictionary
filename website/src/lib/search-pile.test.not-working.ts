import { Types as T } from "@lingdocs/ps-react";
import { searchRow, searchVerbBlock } from "./search-pile";

const r1: T.PersonLine = [
  [
    { p: "تور", f: "tor" },
    { p: "تور", f: "tor" },
    { p: "بور", f: "bor" },
  ],
  [{ p: "کور", f: "kor" }],
];
const r2: T.PersonLine = [
  [
    { p: "تور", f: "tor" },
    { p: "بور", f: "bor" },
  ],
  [
    { p: "کور", f: "kor" },
    { p: "تور", f: "tor" },
  ],
];
const r3: T.PersonLine = [
  [{ p: "بور", f: "bor" }],
  [
    { p: "کور", f: "kor" },
    { p: "تور", f: "tor" },
    { p: "تور", f: "tor" },
  ],
];

test("row search works", () => {
  const f = (ps: T.PsString) => ps.f === "tor";
  expect(searchRow(r1, f)).toEqual([{ ps: { p: "تور", f: "tor" }, pos: [0] }]);
  expect(searchRow(r2, f)).toEqual([
    { ps: { p: "تور", f: "tor" }, pos: [0, 1] },
  ]);
  expect(searchRow(r3, f)).toEqual([{ ps: { p: "تور", f: "tor" }, pos: [1] }]);
});

// const v = [{p: "کوم", f: "kawum"}]

const vb1: T.VerbBlock = [
  [
    [
      { p: "کوم", f: "kawum" },
      { p: "کوم", f: "kawum" },
    ],
    [{ p: "کوو", f: "kawoo" }],
  ],
  [
    [
      { p: "کوم", f: "kawum" },
      { p: "کوم", f: "kawum" },
    ],
    [{ p: "کوو", f: "kawoo" }],
  ],
  [[{ p: "کوې", f: "kawe" }], [{ p: "کوئ", f: "kaweyy" }]],
  [[{ p: "کوې", f: "kawe" }], [{ p: "کوئ", f: "kaweyy" }]],
  [[{ p: "کوي", f: "kawee" }], [{ p: "کوي", f: "kawee" }]],
  [[{ p: "کوي", f: "kawee" }], [{ p: "کوي", f: "kawee" }]],
];

const vb2: T.VerbBlock = [
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
  [[{ p: "کوم", f: "kawum" }], [{ p: "کوم", f: "kawum" }]],
];

test("verb block search works", () => {
  expect(searchVerbBlock(vb1, (ps: T.PsString) => ps.f === "kawum")).toEqual([
    {
      ps: { p: "کوم", f: "kawum" },
      pos: [
        [0, 0],
        [1, 0],
      ],
    },
  ]);
  expect(searchVerbBlock(vb1, (ps: T.PsString) => ps.f === "kawe")).toEqual([
    {
      ps: { p: "کوې", f: "kawe" },
      pos: [
        [2, 0],
        [3, 0],
      ],
    },
  ]);
  expect(searchVerbBlock(vb1, (ps: T.PsString) => ps.f === "kawee")).toEqual([
    {
      ps: { p: "کوي", f: "kawee" },
      pos: [
        [4, 0],
        [4, 1],
        [5, 0],
        [5, 1],
      ],
    },
  ]);
  expect(searchVerbBlock(vb2, (ps: T.PsString) => ps.f === "kawum")).toEqual([
    {
      ps: { p: "کوم", f: "kawum" },
      pos: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [2, 0],
        [2, 1],
        [3, 0],
        [3, 1],
        [4, 0],
        [4, 1],
        [5, 0],
        [5, 1],
      ],
    },
  ]);
});
