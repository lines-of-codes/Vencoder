import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import { createEffect, createSignal, Show } from "solid-js";

const DEFAULT_CRF = 23;

function LibaomOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [rateControlMode, setRateControlMode] = createSignal("Constant");

    createEffect(() => {
        const mode = rateControlMode();

        props.onParamChanged("twopass", mode === "2PassABR");

        switch (mode) {
            case "Constant":
                props.onParamChanged("crf", props.params.crf ?? DEFAULT_CRF);
                props.onParamChanged("vbitrate", undefined);
                break;
            case "Constrained":
                props.onParamChanged("crf", props.params.crf ?? DEFAULT_CRF);
                props.onParamChanged(
                    "vbitrate",
                    props.params.vbitrate ?? DEFAULT_BITRATE,
                );
                break;
            case "2PassABR":
            case "ABR":
                props.onParamChanged("crf", undefined);
                props.onParamChanged(
                    "vbitrate",
                    props.params.vbitrate ?? DEFAULT_BITRATE,
                );
                break;
        }
    });

    return (
        <section id="encoderOptions" class="k-form">
            <label>Help</label>
            <div>
                <button
                    class="icon-button"
                    onclick={() =>
                        os.open(
                            "https://trac.ffmpeg.org/wiki/Encode/AV1#libaom",
                        )
                    }
                    title="Click to view the documentation for this encoder."
                >
                    <BreezeIcon icon="help-about" alt="Help" />
                </button>
            </div>
            <label for="rateControlMode">Rate-control modes</label>
            <select
                class="k-dropdown"
                onchange={(e) => setRateControlMode(e.target.value)}
                name="rateControlMode"
                id="rateControlMode"
            >
                <option value="Constant">Constant Quality</option>
                <option value="Constrained">Constrained Quality</option>
                <option value="2PassABR">2-Pass Average Bitrate</option>
                <option value="ABR">1-Pass Average Bitrate</option>
            </select>
            <Show
                when={
                    rateControlMode() === "Constant" ||
                    rateControlMode() === "Constrained"
                }
            >
                <label for="crf">CRF</label>
                <input
                    type="number"
                    name="crf"
                    id="crf"
                    min="1"
                    max="63"
                    value={props.params.crf ?? DEFAULT_CRF}
                    oninput={(e) => {
                        props.onParamChanged("crf", parseInt(e.target.value));
                    }}
                />
            </Show>
            <Show when={rateControlMode() !== "Constant"}>
                <label for="bitrate">Bitrate</label>
                <div class="row gap2 align-items-center">
                    <input
                        type="number"
                        name="bitrate"
                        id="bitrate"
                        aria-label="Kbps"
                        value={props.params.vbitrate ?? DEFAULT_BITRATE}
                        oninput={(e) => {
                            props.onParamChanged(
                                "vbitrate",
                                parseInt(e.target.value),
                            );
                        }}
                    />
                    <span>Kbps</span>
                </div>
            </Show>
        </section>
    );
}

export default LibaomOptions;
