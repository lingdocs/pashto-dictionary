const arabicNumsRegex = /[۰-۹]/g;
const pRegex = /اً|أ|ا|آ|ٱ|ٲ|ٳ|ئی|ئي|ئے|یٰ|ی|ي|ې|ۍ|ئ|ے|س|ص|ث|څ|ج|چ|هٔ|ه|ۀ|غز|زغ|کش|شک|ښک|ښک|پښ|ښپ|ہ|ع|و|ؤ|ښ|غ|خ|ح|ش|ز|ض|ذ|ځ|ظ|ژ|ر|ړ|ڑ|ت|ټ|ٹ|ط|د|ډ|ڈ|مب|م|نب|ن|ڼ|ک|ګ|گ|ل|ق|ږ|ب|پ|ف/g;
// [\u0621-\u065f\u0670-\u06d3\u06d5]/g;
const pTable: ({
    chars: string[],
    beg: string,
    mid: string,
    end: string,
} | {
    chars: string[],
    sound: string,
})[] = [
    {
        chars: ["ءع"],
        sound: "",
    },
    {
        chars: ["آ"],
        sound: "a",
    },
    {
        chars: ["أ"],
        sound: "U",
    },
    {
        chars: ["ؤ"],
        sound: "o/w",
    },
    {
        chars: ["إ"],
        sound: "i",
    },
    {
        chars: ["ئ"],
        beg: "y",
        mid: "y",
        end: "eyy",
    },
    {
        chars: ["ا"],
        beg: "aa/a/i/u/U",
        mid: "aa",
        end: "aa",
    },
    {
        chars: ["ب"],
        sound: "b",
    },
    {
        chars: ["ة"],
        sound: "a/u",
    },
    {
        chars: ["ت", "ط"],
        sound: "t",
    },
    {
        chars: ["ټ"],
        sound: "T",
    },
    {
        chars: ["ث", "س", "ص"],
        sound: "s",
    },
    {
        chars: ["ج"],
        sound: "j",
    },
    {
        chars: ["ح"],
        sound: "h",
    },
    {
        chars: ["اه"],
        sound: "aah",
    },
    {
        chars: ["ه"],
        beg: "h",
        mid: "h",
        end: "a/i/u/h",
    },
    {
        chars: ["خ"],
        sound: "kh",
    },
    {
        chars: ["د"],
        sound: "d",
    },
    {
        chars: ["ذ", "ز", "ض", "ظ"],
        sound: "z",
    },
    {
        chars: ["ډ"],
        sound: "D",
    },
    {
        chars: ["ر"],
        sound: "r",
    },
    {
        chars: ["ړ"],
        sound: "R",
    },
    {
        chars: ["ش"],
        sound: "sh",
    },
    {
        chars: ["غ"],
        sound: "gh",
    },
    {
        chars: ["ف"],
        sound: "f",
    },
    {
        chars: ["ق"],
        sound: "q",
    },
    {
        chars: ["ك", "ک"],
        sound: "k",
    },
    {
        chars: ["ل"],
        sound: "l",
    },
    {
        chars: ["م"],
        sound: "m",
    },
    {
        chars: ["ن"],
        sound: "n",
    },
    {
        chars: ["ڼ"],
        sound: "N",
    },
    {
        chars: ["و"],
        beg: "w",
        mid: "w/o/oo",
        end: "w/o/oo",
    },
    {
        chars: ["ای"],
        sound: "aay",
    },
    {
        chars: ["وی"],
        sound: "ooy",
    },
    {
        chars: ["ی", "ے"],
        beg: "y",
        mid: "ey/ee/y",
        end: "ey",
    },
    {
        chars: ["ي"],
        beg: "y",
        mid: "ey/ee/y",
        end: "ee",
    },
    {
        chars: ["اً"],
        sound: "an",
    },
    {
        chars: ["ځ"],
        sound: "dz",
    },
    {
        chars: ["څ"],
        sound: "ts",
    },
    {
        chars: ["چ"],
        sound: "ch",
    },
    {
        chars: ["ږ"],
        sound: "G",
    },
    {
        chars: ["ژ"],
        sound: "jz",
    },
    {
        chars: ["ښ"],
        sound: "x",
    },
    {
        chars: ["ۍ"],
        sound: "uy",
    },
    {
        chars: ["ې"],
        sound: "e",
    },
    {
        chars: ["ګ", "گ"],
        sound: "g",
    },
    {
        chars: ["یٰ"],
        sound: "aa",
    },
];


//     "ء": "",
//     "آ": "",
//     "أ": "",
//     "ؤ": "",
//     "إ": "",
//     "ئ": "",
//     "ا": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
//     "": "",
// }
const numsTable = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
};


export function handlePunctuationAndNums(s: string): string {
    return s.replace(/؟/g, "?")
        .replace(/،/g, ",")
        .replace(/«/g, '"')
        .replace(/»/g, '"')
        .replace(arabicNumsRegex, (mtch) => {
            // @ts-ignore
            return numsTable[mtch];
        });
}

export function handleUnmatched(s: string): string {
    const g = s.replace(pRegex, (mtch, i) => {
        const pos: "beg" | "mid" | "end" = i === 0
            ? "beg"
            : i === s.length-1
            ? "end"
            : "mid";
        const m = pTable.find(x => x.chars.includes(mtch));
        if (!m) return "";
        const sound = "sound" in m ? m.sound : m[pos];
        return sound.includes("/") ? `(${sound})` : sound;
    })
    return `?*${g}*?`;
}