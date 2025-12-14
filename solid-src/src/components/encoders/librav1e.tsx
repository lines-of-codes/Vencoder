import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import { onMount } from "solid-js";
import RateInput from "../RateInput";

function Librav1eOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    onMount(() => {
        props.onParamChanged(
            "vbitrate",
            props.params.vbitrate ?? DEFAULT_BITRATE,
        );
        props.onParamChanged("speed", 5);
    });

    return (
        <section id="encoderOptions" class="k-form">
            <label>Help</label>
            <div>
                <button
                    class="icon-button"
                    onclick={() =>
                        os.open(
                            "https://www.ffmpeg.org/ffmpeg-all.html#librav1e",
                        )
                    }
                    title="Click to view the documentation for this encoder."
                >
                    <BreezeIcon icon="help-about" alt="Help" />
                </button>
            </div>
            <label>Speed</label>
            <input
                type="number"
                name="speed"
                id="speed"
                min="0"
                max="10"
                value={props.params.speed ?? 5}
                oninput={(e) =>
                    props.onParamChanged("speed", parseInt(e.target.value))
                }
            />
            <label for="bitrate">Bitrate</label>
            <RateInput
                name="bitrate"
                id="bitrate"
                value={props.params.vbitrate ?? DEFAULT_BITRATE}
                oninput={(e) =>
                    props.onParamChanged("vbitrate", parseInt(e.target.value))
                }
            />
        </section>
    );
}

export default Librav1eOptions;
