import { type CodecInfo, type FFmpegParams } from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import { onMount } from "solid-js";

function Librav1eOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: (key: string, value: any) => void;
}) {
    onMount(() => {
        props.onParamChanged("crf", undefined);
        props.onParamChanged("vbitrate", undefined);
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
            </div>
        </section>
    );
}

export default Librav1eOptions;
