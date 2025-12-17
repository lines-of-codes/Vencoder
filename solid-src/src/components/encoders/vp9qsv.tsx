import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import RateInput from "../RateInput";

function VP9QsvOptions({
    params,
    onParamChanged,
}: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [rateControl, setRateControl] = createSignal("vbr");
    const [bitrate, setBitrate] = createSignal(DEFAULT_BITRATE);
    const [cqp, setCqp] = createSignal(18);

    createEffect(() => {
        const opts: Record<string, string> = {};

        switch (rateControl()) {
            case "cbr":
                onParamChanged("vbitrate", bitrate());
                opts["maxrate"] = `${bitrate() ?? DEFAULT_BITRATE}k`;
                break;
            case "vbr":
                onParamChanged("vbitrate", bitrate());
                break;
            case "cqp":
                onParamChanged("vbitrate", undefined);
                opts["q"] = cqp().toString();
                break;
        }

        onParamChanged("extraopts", {
            input: { hwaccel_output_format: "qsv" },
            output: opts,
        });
    });

    onMount(() => {
        onParamChanged("preset", "medium");
        onParamChanged("hwaccel", "qsv");
    });

    return (
        <section id="encoderOptions" class="k-form">
            <label for="preset">Preset</label>
            <select
                name="preset"
                id="preset"
                class="k-dropdown"
                value={params.preset ?? "medium"}
                oninput={(e) => onParamChanged("preset", e.target.value)}
            >
                <option value="veryfast">Very Fast</option>
                <option value="faster">Faster</option>
                <option value="fast">Fast</option>
                <option value="medium">Medium</option>
                <option value="slow">Slow</option>
                <option value="slower">Slower</option>
                <option value="veryslow">Very Slow</option>
                <option value="0">Unspecified</option>
            </select>
            <label for="rateControl">Rate Control Mode</label>
            <select
                name="rateControl"
                id="rateControl"
                class="k-dropdown"
                value={rateControl()}
                oninput={(e) => setRateControl(e.target.value)}
            >
                <option value="cbr">CBR: Constant Bitrate</option>
                <option value="cqp">
                    CQP: Constant Quantization Parameter
                </option>
                <option value="vbr">VBR: Variable Bitrate</option>
            </select>
            <Show when={rateControl() === "cqp"}>
                <label for="cqp">CQP</label>
                <input
                    type="number"
                    name="cqp"
                    id="cqp"
                    min="1"
                    max="51"
                    value={cqp()}
                    oninput={(e) => setCqp(parseInt(e.target.value))}
                />
            </Show>
            <Show when={rateControl() === "cbr" || rateControl() === "vbr"}>
                <label for="bitrate">Bitrate</label>
                <RateInput
                    name="bitrate"
                    id="bitrate"
                    value={bitrate()}
                    oninput={(e) => setBitrate(parseInt(e.target.value))}
                />
            </Show>
            <Show when={rateControl() === "vbr" || rateControl() === "icq"}>
                <div></div>
                <div
                    class="checkbox-container"
                    title="May not be available on some platforms."
                >
                    <input type="checkbox" name="lookAhead" id="lookAhead" />
                    <label for="lookAhead">Look-ahead mode</label>
                </div>
            </Show>
        </section>
    );
}

export default VP9QsvOptions;
