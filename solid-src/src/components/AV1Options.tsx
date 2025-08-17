import { Match, Switch } from "solid-js";
import type { CodecInfo, FFmpegParams } from "@/util/ffmpeg";
import LibaomOptions from "./encoders/libaom";
import Librav1eOptions from "./encoders/librav1e";

function AV1Options(props: {
    codec: CodecInfo | undefined;
    encoder: string;
    params: FFmpegParams;
    onParamChanged: (key: string, value: any) => void;
}) {
    return (
        <Switch fallback={<div>No options.</div>}>
            <Match when={props.encoder === "libaom-av1"}>
                <LibaomOptions {...props} />
            </Match>
            <Match when={props.encoder === "librav1e"}>
                <Librav1eOptions {...props} />
            </Match>
        </Switch>
    );
}

export default AV1Options;
