import { Match, Switch } from "solid-js";
import type {
    CodecInfo,
    FFmpegParamChangedFunc,
    FFmpegParams,
} from "@/util/ffmpeg";
import LibaomOptions from "./encoders/libaom";
import Librav1eOptions from "./encoders/librav1e";
import LibSvtAv1Options from "./encoders/libsvtav1";
import NvEncOptions from "./encoders/nvenc";

function AV1Options(props: {
    codec: CodecInfo | undefined;
    encoder: string;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    return (
        <Switch fallback={<div class="text-center mt-4">No options.</div>}>
            <Match when={props.encoder === "libaom-av1"}>
                <LibaomOptions {...props} />
            </Match>
            <Match when={props.encoder === "librav1e"}>
                <Librav1eOptions {...props} />
            </Match>
            <Match when={props.encoder === "libsvtav1"}>
                <LibSvtAv1Options {...props} />
            </Match>
            <Match when={props.encoder === "av1_nvenc"}>
                <NvEncOptions {...props} />
            </Match>
        </Switch>
    );
}

export default AV1Options;
