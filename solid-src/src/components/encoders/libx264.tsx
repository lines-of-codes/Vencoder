import { createSignal, Show } from "solid-js";
import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import RateInput from "../RateInput";

const information = {
    h264: {
        defaultCrf: 23,
    },
    hevc: {
        defaultCrf: 28,
    },
};

/**
 * Options for H.264/H.265 codecs
 */
function LibH26xOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [twopass, setTwopass] = createSignal(false);
    const defaultCrf =
        props.codec?.shortName === "h264"
            ? information.h264.defaultCrf
            : information.hevc.defaultCrf;

    return (
        <section id="commonLossyOptions" class="k-form">
            <div></div>
            <div class="checkbox-container">
                <input
                    type="checkbox"
                    value={props.params.twopass?.toString()}
                    onInput={(e) => {
                        props.params.twopass = e.target.checked;
                        props.onParamChanged("twopass", e.target.checked);
                        setTwopass(e.target.checked);
                    }}
                    id="twopassCheck"
                />
                <label for="twopassCheck">
                    Use target bitrate instead of CRF
                </label>
                <button
                    class="icon-button"
                    onclick={() =>
                        os.open(
                            "https://trac.ffmpeg.org/wiki/Encode/H.264#twopass",
                        )
                    }
                    title="This will use the two-pass rate control mode instead of relying on a Constant Rate Factor (CRF) value."
                >
                    <BreezeIcon icon="help-about" alt="Help" />
                </button>
            </div>
            <label for="encodingPreset">Preset</label>
            <select
                class="k-dropdown"
                name="encodingPreset"
                id="encodingPreset"
                value={props.params.preset ?? "medium"}
                oninput={(e) => {
                    props.params.preset = e.target.value;
                    props.onParamChanged("preset", e.target.value);
                }}
            >
                <option value="ultrafast">ultrafast</option>
                <option value="superfast">superfast</option>
                <option value="veryfast">veryfast</option>
                <option value="faster">faster</option>
                <option value="fast">fast</option>
                <option value="medium">medium (Default)</option>
                <option value="slow">slow</option>
                <option value="slower">slower</option>
                <option value="veryslow">veryslow</option>
                <option
                    value="placebo"
                    title="Don't use this option, it rarely helps."
                >
                    placebo
                </option>
            </select>
            <Show
                when={twopass()}
                fallback={
                    <>
                        <label for="crf">CRF</label>
                        <input
                            type="number"
                            name="crf"
                            id="crf"
                            min="0"
                            max="51"
                            value={props.params.crf ?? defaultCrf}
                            oninput={(e) => {
                                props.params.crf = parseInt(e.target.value);
                                props.onParamChanged(
                                    "crf",
                                    parseInt(e.target.value),
                                );
                            }}
                        />
                    </>
                }
            >
                <label for="bitrate">Bitrate</label>
                <RateInput
                    name="bitrate"
                    id="bitrate"
                    value={props.params.vbitrate ?? DEFAULT_BITRATE}
                    oninput={(e) =>
                        props.onParamChanged(
                            "vbitrate",
                            parseInt(e.target.value),
                        )
                    }
                />
            </Show>
        </section>
    );
}

export default LibH26xOptions;
