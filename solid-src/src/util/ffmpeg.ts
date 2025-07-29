import Neutralino from "@neutralinojs/lib";

export interface CodecInfo {
    flags: string;
    shortName: string;
    description: string;
    encoders: string[];
}

export async function getAvailableCodecs(): Promise<CodecInfo[]> {
    const seperator = "-------";
    const videoEncodingSupported = /.EV.../;
    const wideFormattingSpaces = / {2,}/;
    const decodeEncodeSpecification = / \(((decoders)|(encoders)):.+\)/g;
    const result = await Neutralino.os.execCommand("ffmpeg -codecs");
    const rawCodecList = result.stdOut
        .substring(result.stdOut.indexOf(seperator) + seperator.length)
        .split("\n");
    let codecs = [];

    for (let codec of rawCodecList) {
        codec = codec.trim();
        const flags = codec.substring(0, 6);

        if (!videoEncodingSupported.test(flags)) {
            continue;
        }

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

        codecs.push({
            flags,
            shortName,
            description,
            encoders,
        });
    }

    return codecs;
}

export function playFile(path: string) {
    Neutralino.os.execCommand(`ffplay "${path}"`);
}

export const videoFileExtensions: { [key: string]: string } = {
    dnxhd: "mov",
    h264: "mp4",
    hevc: "mp4",
    av1: "webm",
    vp8: "webm",
    vp9: "webm",
};

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
}

const NULL_LOCATION = window.NL_OS === "Windows" ? "NUL" : "/dev/null";

export function generateOutputCommand(params: FFmpegParams) {
    let faststart =
        params.faststart && params.vcodec === "h264"
            ? " -movflags +faststart"
            : "";

    if (params.twopass) {
        const commonOpts = `-i "${params.inputFile ?? "{fileName}"}" -c:v ${params.encoder ?? params.vcodec} -b:v ${
            params.vbitrate ?? 12000
        }k${faststart}${
            params.preset === undefined ? "" : ` -preset ${params.preset}`
        } -progress -`;

        return `ffmpeg -hwaccel auto -y ${commonOpts} ${params.vcodec === "h264" ? "-pass 1" : "-x265-params pass=1"} ${
            params.doNotUseAn ? "-vsync cfr" : "-an"
        } -f null ${NULL_LOCATION} &&
ffmpeg -y -hwaccel auto ${commonOpts} ${
            params.vcodec === "h264" ? "-pass 2" : "-x265-params pass=2"
        } -c:a ${
            params.acodec ?? "copy"
        }${params.abitrate === undefined ? "" : ` -b:a ${params.abitrate}k`} "${params.outputFile ?? "{output}"}"`;
    }

    return `ffmpeg -y -hwaccel auto -i "${params.inputFile ?? "{fileName}"}" -c:v ${params.encoder ?? params.vcodec}${
        params.crf === undefined ? "" : ` -crf ${params.crf}`
    }${faststart}${
        params.preset === undefined ? "" : ` -preset ${params.preset}`
    } -c:a ${params.acodec ?? "copy"}${
        params.abitrate === undefined ? "" : ` -b:a ${params.abitrate}k`
    } -progress - "${params.outputFile ?? "{output}"}"`;
}
