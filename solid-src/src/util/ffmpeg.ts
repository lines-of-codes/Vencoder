import Neutralino from "@neutralinojs/lib";

export interface CodecInfo {
    flags: string;
    shortName: string;
    description: string;
    encoders: string[];
}

export type CodecList = {
    vcodecs: CodecInfo[];
    acodecs: CodecInfo[];
};

export async function getAvailableCodecs(): Promise<CodecList> {
    const seperator = "-------";
    const wideFormattingSpaces = / {2,}/;
    const decodeEncodeSpecification = / \(((decoders)|(encoders)):.+\)/g;
    const result = await Neutralino.os.execCommand("ffmpeg -codecs");
    const rawCodecList = result.stdOut
        .substring(result.stdOut.indexOf(seperator) + seperator.length)
        .split("\n");
    let vcodecs = [];
    let acodecs = [];

    for (let codec of rawCodecList) {
        codec = codec.trim();
        const flags = codec.substring(0, 6);

        if (flags[1] !== "E") continue;

        const nameAndDescription = codec
            .substring(7)
            .replace(wideFormattingSpaces, " ");

        const seperatorIndex = nameAndDescription.indexOf(" ");
        const shortName = nameAndDescription.substring(0, seperatorIndex);
        const description = nameAndDescription
            .substring(seperatorIndex + 1)
            .replaceAll(decodeEncodeSpecification, "");

        const encoderIndex = nameAndDescription.search(/ \((encoders):.+\)/);
        let encoders: string[] = [];

        if (encoderIndex !== -1) {
            const rawEncoderList = nameAndDescription
                .substring(encoderIndex)
                .trim();
            encoders = rawEncoderList
                .substring(11, rawEncoderList.length - 1)
                .split(" ");
        }

        if (flags[2] === "V") {
            vcodecs.push({
                flags,
                shortName,
                description,
                encoders,
            });
        } else if (flags[2] === "A") {
            acodecs.push({
                flags,
                shortName,
                description,
                encoders,
            });
        }
    }

    return {
        vcodecs,
        acodecs,
    };
}

export async function getPixelFormats(): Promise<string[]> {
    const seperator = "-----";
    const result = await Neutralino.os.execCommand("ffmpeg -pix_fmts");
    const rawFormatList = result.stdOut
        .substring(result.stdOut.indexOf(seperator) + seperator.length)
        .split("\n");
    let outputFormats = [];

    for (let format of rawFormatList) {
        format = format.trim();
        const flags = format.substring(0, 5);

        if (flags[1] !== "O") continue;

        const parts = format.substring(6).split(/ +/);

        outputFormats.push(parts[0]);
    }

    return outputFormats;
}

export function playFile(path: string) {
    Neutralino.os.execCommand(`ffplay "${path}"`);
}

export const videoFileExtensions: { [key: string]: string } = {
    dnxhd: "mov",
    h264: "mp4",
    hevc: "mp4",
    av1: "mkv",
    vp8: "mkv",
    vp9: "mkv",
};

export interface UserFFmpegArguments {
    global: string;
    input: string;
    output: string;
}

export interface ProgramFFmpegArguments {
    global?: { [key: string]: string | undefined };
    input?: { [key: string]: string | undefined };
    output?: { [key: string]: string | undefined };
}

export interface FFmpegParams {
    inputFile?: string;
    outputFile?: string;
    vcodec: string;
    encoder?: string;
    acodec?: string;
    crf?: number;
    twopass?: boolean;
    /**
     * Video Bitrate
     */
    vbitrate?: number;
    /**
     * Audio Bitrate
     */
    abitrate?: number;
    hwaccel?: string;
    preset?: string;
    faststart?: boolean;
    doNotUseAn?: boolean;
    speed?: number;
    pixelFormat?: string;
    i_qfactor?: number;
    b_qfactor?: number;
    /**
     * Custom file extension
     */
    customExt?: string;
    /**
     * Extra parameters defined by users
     */
    useropts: UserFFmpegArguments;
    /**
     * Extra output parameters defined by Vencoder
     */
    extraopts: ProgramFFmpegArguments;
}

export type FFmpegParamChangedFunc = <K extends keyof FFmpegParams>(
    key: K,
    value: FFmpegParams[K],
) => void;

const NULL_LOCATION = window.NL_OS === "Windows" ? "NUL" : "/dev/null";

/**
 * Using 12 Mbps (YouTube's recommended bitrate for high frame rate 1080p
 * video) as an arbitrary value
 */
export const DEFAULT_BITRATE = 12000;

export function generateOutputCommand(params: FFmpegParams) {
    let faststart =
        params.faststart &&
            (params.customExt === "mp4" ||
                (params.customExt === "" &&
                    videoFileExtensions[params.vcodec] === "mp4"))
            ? " -movflags +faststart"
            : "";

    let globalopts = `-hwaccel ${params.hwaccel ?? "auto"} -y`;
    let inputopts =
        params.useropts.input !== "" ? " " + params.useropts.input : "";
    let outputopts =
        params.useropts.output !== "" ? " " + params.useropts.output : "";

    if (params.useropts.global !== "") {
        globalopts += " " + params.useropts.global;
    }

    if (params.pixelFormat) {
        if (params.extraopts.output === undefined) {
            params.extraopts.output = {};
        }

        params.extraopts.output["pix_fmt"] = params.pixelFormat;
    }

    if (params.extraopts.output !== undefined) {
        for (const key in params.extraopts.output) {
            if (params.extraopts.output[key] === undefined) continue;

            outputopts += ` -${key} ${params.extraopts.output[key]}`.trimEnd();
        }
    }

    if (params.extraopts.input !== undefined) {
        for (const key in params.extraopts.input) {
            if (params.extraopts.input[key] === undefined) continue;

            inputopts += ` -${key} ${params.extraopts.input[key]}`.trimEnd();
        }
    }

    if (params.extraopts.global !== undefined) {
        for (const key in params.extraopts.global) {
            if (params.extraopts.global[key] === undefined) continue;

            globalopts += ` -${key} ${params.extraopts.global[key]}`.trimEnd();
        }
    }

    if (params.twopass) {
        const commonOpts = `${globalopts}${inputopts} -i "${params.inputFile ?? "{fileName}"}" -c:v ${params.encoder ?? params.vcodec} -b:v ${params.vbitrate ?? DEFAULT_BITRATE
            }k${faststart}${params.preset === undefined ? "" : ` -preset ${params.preset}`
            } -progress -${outputopts}`;

        return `ffmpeg ${commonOpts} ${params.vcodec === "hevc" ? "-x265-params pass=1" : "-pass 1"} ${params.doNotUseAn ? "-vsync cfr" : "-an"
            } -f null ${NULL_LOCATION} &&
ffmpeg ${commonOpts} ${params.vcodec === "hevc" ? "-x265-params pass=2" : "-pass 2"
            } -c:a ${params.acodec ?? "copy"
            }${params.abitrate === undefined ? "" : ` -b:a ${params.abitrate}k`} "${params.outputFile ?? "{output}"}"`;
    }

    return `ffmpeg ${globalopts}${inputopts} -i "${params.inputFile ?? "{fileName}"}" -c:v ${params.encoder ?? params.vcodec}${params.crf === undefined ? "" : ` -crf ${params.crf}`
        }${params.vbitrate === undefined ? "" : ` -b:v ${params.vbitrate}k`
        }${faststart}${params.preset === undefined ? "" : ` -preset ${params.preset}`
        } -c:a ${params.acodec ?? "copy"}${params.abitrate === undefined ? "" : ` -b:a ${params.abitrate}k`
        }${params.speed === undefined ? "" : ` -speed ${params.speed}`
        } -progress -${outputopts} "${params.outputFile ?? "{output}"}"`;
}

export async function getLengthMicroseconds(target: string) {
    const result = await Neutralino.os.execCommand(
        `ffprobe -v quiet -of json=c=1 -show_entries format=duration -sexagesimal "${target}"`,
    );
    const rawDuration = JSON.parse(result.stdOut)["format"]["duration"].split(
        ":",
    ) as string[];

    const hours = parseInt(rawDuration[0]);
    const minutes = hours * 60 + parseInt(rawDuration[1]);
    const seconds = minutes * 60 + parseFloat(rawDuration[2]);

    return Math.trunc(seconds * 1000000);
}
