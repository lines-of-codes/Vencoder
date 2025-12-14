import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import RateInput from "../RateInput";

function H264QsvOptions({
    onParamChanged,
}: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [rateControl, setRateControl] = createSignal("icq");
    const [globalQuality, setGlobalQuality] = createSignal(18);
    const [bitrate, setBitrate] = createSignal(DEFAULT_BITRATE);
    const [cqp, setCqp] = createSignal(18);

    createEffect(() => {
        const opts: Record<string, string> = {};

        switch (rateControl()) {
            case "icq":
                onParamChanged("vbitrate", undefined);
                const quality = globalQuality();
                opts["global_quality"] = quality.toString();
                break;
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

        onParamChanged("extraopts", { output: opts });
    });

    onMount(() => {
        onParamChanged("hwaccel", "qsv");
    });

    return (
        <section id="encoderOptions" class="k-form">
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
                <option value="icq">ICQ: Intelligent Constant Quality</option>
            </select>
            <Show when={rateControl() === "icq"}>
                <label for="globalQuality">Global Quality</label>
                <input
                    type="number"
                    name="globalQuality"
                    id="globalQuality"
                    min="1"
                    max="51"
                    value={globalQuality()}
                    oninput={(e) => setGlobalQuality(parseInt(e.target.value))}
                />
            </Show>
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

export default H264QsvOptions;
