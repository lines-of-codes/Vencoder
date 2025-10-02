import { Match, Switch } from "solid-js";
import {
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "../util/ffmpeg";
import LibH26xOptions from "./encoders/libx264";
import H264QsvOptions from "./encoders/h264qsv";

/**
 * Options for H.264/H.265 codecs
 */
function H264Options(props: {
    codec: CodecInfo | undefined;
    encoder: string;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    return (
        <Switch fallback={<div class="text-center mt-4">No options.</div>}>
            <Match
                when={
                    props.encoder === "libx264" ||
                    props.encoder === "libx264rgb" ||
                    props.encoder === "libx265"
                }
            >
                <LibH26xOptions {...props} />
            </Match>
            <Match
                when={
                    props.encoder === "h264_qsv" || props.encoder === "hevc_qsv"
                }
            >
                <H264QsvOptions {...props} />
            </Match>
        </Switch>
    );
}

export default H264Options;
