/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Returns the amount of milleseconds in a given period
 * 
 * @param units the units of time to be used
 * @param quantity the amount of the units of time 
 * @returns the number of milleseconds in the given period of time 
 */
export function getMillisecondsPeriod(
    units: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years",
    quantity: number,
): number {
    const seconds = (x: number) => x * 1000;
    const minutes = (x: number) => x * seconds(60);
    const hours = (x: number) => x * minutes(60);
    const days = (x: number) => x * hours(24);
    const months = (x: number) => x * days(30);
    const years = (x: number) => x * months(12);
    return (units === "seconds" ?
        seconds
        : units === "minutes" ?
        minutes
        : units === "hours" ?
        hours
        : units === "days" ?
        days
        : units === "months" ?
        months
        : years
    )(quantity);
}