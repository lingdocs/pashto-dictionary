import {
    Types as T,
    getEnglishPersonInfo,
} from "@lingdocs/ps-react";

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function conflateUnisexPeople(arr: (string | T.Person)[]): (string | T.Person)[] {
    let newArr = [...arr];
    function remove(value: number) {
        var index = newArr.indexOf(value);
        if (index > -1) {
          newArr.splice(index, 1);
        }
    }
    if (arr.includes(0) && arr.includes(1)) {
        remove(0);
        remove(1)
        newArr = ["1st pers. sing.", ...newArr];
    }
    if (arr.includes(2) && arr.includes(3)) {
        remove(2);
        remove(3);
        newArr = ["2nd pers. sing.", ...newArr];
    }
    if (arr.includes(4) && arr.includes(5)) {
        remove(4);
        remove(5);
        newArr = ["3rd pers. sing.", ...newArr];
    }
    if (arr.includes(6) && arr.includes(7)) {
        remove(6);
        remove(7);
        newArr = ["1st pers. plur.", ...newArr];
    }
    if (arr.includes(8) && arr.includes(9)) {
        remove(8);
        remove(9);
        newArr = ["2nd pers. plur.", ...newArr];
    }
    if (arr.includes(10) && arr.includes(11)) {
        remove(10);
        remove(11);
        newArr = ["3rd pers. plur.", ...newArr];
    }
    if ([0,1,2,3,4,5,6,7,8,9,10,11].every(x => arr.includes(x))) {
        newArr = ["Doesn't change"];
    }
    return newArr;
}

export function displayPositionResult(res: (T.Person | "plain" | "1st" | "2nd" | "plural")[] | null): string {
    const conflated = res
        ? conflateUnisexPeople(res)
        : ["Doesn't change"];
    return conflated.map((x) => {
        if (x === "plural") return "";
        if (x === "plain") return "Plain";
        if (x === "1st") return "1st Inflection";
        if (x === "2nd") return "2nd Inflection";
        if (typeof x === "string") return x;
        return x === null ? "Same for all" : getEnglishPersonInfo(x);
    }).join(" / ");
}

export function displayFormResult(res: string[]): string {
    if (res.length === 1 && ["masc", "fem"].includes(res[0])) {
        return res[0] === "masc"
            ? "Masculine Form"
            : "Feminine Form";
    }
    return res.map((word) => capitalizeFirstLetter(word)).join(" ")
        .replace("Stative", "(In the stative version)")
        .replace("Synamic", "(In the dynamic version)")
        .replace("GrammaticallyTransitive", "(In the grammatically transitive version)")
        .replace("Transitive", "(In the transitive version)")
        .replace("Imperfective NonImperative", "Present")
        .replace("Perfective NonImperative", "Subjunctive")
        .replace("Imperfective Past", "Continuous Past")
        .replace("Perfective Past", "Simple Past")
        .replace("Imperfective Modal NonImperative", "Present Ability")
        .replace("Perfective Modal NonImperative", "Subjunctive Ability")
        .replace("Imperfective Modal Past", "Continuous Past Ability")
        .replace("Perfective Modal Past", "Simple Past Ability")
        .replace("Modal Future", "Future Ability")
        .replace("Modal HypotheticalPast", "Hypothetical/Wildcard Ability")
        .replace("Participle Past", "Past Participle")
        .replace("Participle Present", "Present Participle")
        .replace("Perfect HalfPerfect", "Half Perfect")
        .replace("Perfect Past", "Past Perfect")
        .replace("Perfect Present", "Present Perfect")
        .replace("Perfect Subjunctive", "Subjunctive Perfect")
        .replace("Perfect Future", "Future Perfect")
        .replace("Perfect Affirmational", "Affirmational Perfect")
        .replace("Perfect PastSubjunctiveHypothetical", "Past Subjunctive/Hypothetical Perfect")
        .replace("Long", "(long version)")
        .replace("Short", "(short version)")
        .replace("Mini", "(mini version)")
        .replace("MascSing", "(with a masc. sing. object)")
        .replace("MascPlur", "(with a masc. plur. object)")
        .replace("FemSing", "(with a fem. sing. object)")
        .replace("FemPlur", "(with a fem. plur. object)")
        .replace("ArabicPlural", "Arabic Plural")
        .replace("Fem", "Fem.")
        .replace("Masc", "Masc.")
        .replace("BundledPlural", "Bundled Plural");
}