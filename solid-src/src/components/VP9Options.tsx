import { createSignal, Show } from "solid-js";
import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParams,
} from "../util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "./BreezeIcon";
import RateInput from "./RateInput";

function VP9Options(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: (key: string, value: any) => void;
}) {
    const [twopass, setTwopass] = createSignal(false);
    const defaultCrf = 30;

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
                    oninput={(e) => {
                        props.params.vbitrate = parseInt(e.target.value);
                        props.onParamChanged(
                            "vbitrate",
                            parseInt(e.target.value),
                        );
                    }}
                />
            </Show>
            <Show when={props.codec?.shortName === "h264"}>
                <div></div>
                <div class="checkbox-container">
                    <input
                        type="checkbox"
                        value={props.params.faststart?.toString()}
                        onInput={(e) => {
                            props.params.faststart = e.target.checked;
                            props.onParamChanged("faststart", e.target.checked);
                        }}
                        id="fastStartCheck"
                    />
                    <label for="fastStartCheck">Enable Fast Start</label>
                    <button
                        class="icon-button"
                        onclick={() =>
                            os.open(
                                "https://trac.ffmpeg.org/wiki/Encode/H.264#faststartforwebvideo",
                            )
                        }
                        title="This will move some information to the beginning of your file and allow the video to begin playing before it is completely downloaded by the viewer, recommended for web videos. Click for more information."
                    >
                        <BreezeIcon icon="help-about" alt="Help" />
                    </button>
                </div>
            </Show>
        </section>
    );
}

export default VP9Options;
