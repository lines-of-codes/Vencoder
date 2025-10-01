import {
    DEFAULT_BITRATE,
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import { onMount } from "solid-js";

function Librav1eOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    onMount(() => {
        props.onParamChanged("crf", undefined);
        props.onParamChanged(
            "vbitrate",
            props.params.vbitrate ?? DEFAULT_BITRATE,
        );
        props.onParamChanged("speed", 5);
    });

    return (
        <section id="encoderOptions">
            <div class="row flex-col align-items-center">
                <h3 class="k-form-section-title">Encoder Options</h3>
            </div>
            <div class="k-form">
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
                        props.onParamChanged("speed", e.target.value)
                    }
                />
                <label for="bitrate">Bitrate</label>
                <div class="row gap2 align-items-center">
                    <input
                        type="number"
                        name="bitrate"
                        id="bitrate"
                        value={props.params.vbitrate ?? DEFAULT_BITRATE}
                        oninput={(e) =>
                            props.onParamChanged("vbitrate", e.target.value)
                        }
                    />
                    <span>Kbps</span>
                </div>
            </div>
        </section>
    );
}

export default Librav1eOptions;
