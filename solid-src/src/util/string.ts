import type { Temporal } from "temporal-polyfill";

// Code originally from: https://stackoverflow.com/a/1349426/14512055
export function generateRandomString(length: number) {
    let result = "";
    let characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
    }
    return result;
}

function padTime(n: number, l: number = 2) {
    return n.toString().padStart(l, "0");
}

export function durationString(dur: Temporal.Duration) {
    dur = dur.round({ largestUnit: "days" });
    let str = `${padTime(dur.minutes)}:${padTime(dur.seconds)}.${padTime(dur.microseconds, 3)}`;

    if (dur.hours > 0 || dur.days > 0) {
        str = `${padTime(dur.hours)}:` + str;
    }

    if (dur.days > 0) {
        str = `${dur.days}:` + str;
    }

    return str;
}
