import {
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "@/util/ffmpeg";
import { os } from "@neutralinojs/lib";
import BreezeIcon from "@/components/BreezeIcon";
import { createEffect, createSignal, onMount } from "solid-js";

function LibSvtAv1Options({
    params,
    onParamChanged,
}: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [gop, setGop] = createSignal("-1");
    const [filmGrain, setFilmGrain] = createSignal("0");
    const [tune, setTune] = createSignal("1");

    createEffect(() => {
        const g = gop();
        const params = [`tune=${tune()}`];

        if (filmGrain() !== "0") {
            params.push(`film-grain=${filmGrain()}`);
        }

        onParamChanged("outputopts", {
            g: g === "-1" ? undefined : g,
            "svtav1-params": params.join(":"),
        });
    });

    onMount(() => {
        onParamChanged("vbitrate", undefined);

        if (isNaN(parseInt(params.preset ?? ""))) {
            onParamChanged("preset", "5");
        }
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
                                "https://gitlab.com/AOMediaCodec/SVT-AV1/-/blob/master/Docs/Ffmpeg.md",
                            )
                        }
                        title="Click to view the documentation for this encoder."
                    >
                        <BreezeIcon icon="help-about" alt="Help" />
                    </button>
                </div>
                <label for="preset">Preset</label>
                <input
                    type="number"
                    name="preset"
                    id="preset"
                    title="A range from -2 to 13. Higher means faster but a loss in quality. Preset 13 is not intended for human use."
                    value={params.preset ?? 5}
                    oninput={(e) => onParamChanged("preset", e.target.value)}
                    min="-2"
                    max="13"
                />
                <label for="crf">CRF</label>
                <input
                    type="number"
                    name="crf"
                    id="crf"
                    title="A range from 1 to 63. A good starting point for a 1080p video is 30"
                    value={params.crf ?? 30}
                    oninput={(e) =>
                        onParamChanged("crf", parseInt(e.target.value))
                    }
                    min="1"
                    max="63"
                />
                <label for="gop">GOP</label>
                <input
                    type="number"
                    name="gop"
                    id="gop"
                    title="How many frames will pass before the encoder will add a key frame. Specify -1 to leave the parameter unspecified."
                    value={gop()}
                    oninput={(e) => setGop(e.target.value)}
                    min="-1"
                />
                <label for="filmGrain">Film Grain</label>
                <input
                    type="number"
                    name="filmGrain"
                    id="filmGrain"
                    title="Film grains are hard to compress. The encoder can try to replace the film grain in the video with a synthetic grain."
                    value={filmGrain()}
                    oninput={(e) => setFilmGrain(e.target.value)}
                    min="0"
                />
                <label for="tune">Tune</label>
                <select
                    name="tune"
                    id="tune"
                    class="k-dropdown"
                    value={tune()}
                    oninput={(e) => setTune(e.target.value)}
                >
                    <option value="0">Subjective Quality</option>
                    <option value="1">Objective Quality (PSNR)</option>
                </select>
            </div>
        </section>
    );
}

export default LibSvtAv1Options;
