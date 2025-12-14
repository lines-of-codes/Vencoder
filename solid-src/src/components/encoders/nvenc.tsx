import {
    type CodecInfo,
    type FFmpegParams,
    type FFmpegParamChangedFunc,
    type ProgramFFmpegArguments,
    DEFAULT_BITRATE,
} from "@/util/ffmpeg";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import RateInput from "../RateInput";
import HelpButton from "../HelpButton";

// A default lower bitrate as that's probably more useful when encoding with VBR
const LOWER_BITRATE = 8000;

function NvEncOptions({
    codec,
    params,
    onParamChanged,
}: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    const [tune, setTune] = createSignal("hq");
    const [rateControl, setRateControl] = createSignal("vbr");
    const [lookahead, setLookahead] = createSignal("20");
    const [temporalAq, setTemporalAq] = createSignal(true);
    const [spatialAq, setSpatialAq] = createSignal(false);
    const [aqStrength, setAqStrength] = createSignal("8");
    const [qp, setQp] = createSignal("-1");
    const [bitrate, setBitrate] = createSignal(LOWER_BITRATE.toString());
    const [bufSize, setBufSize] = createSignal(LOWER_BITRATE.toString());
    const [maxRate, setMaxRate] = createSignal(DEFAULT_BITRATE.toString());
    const [cq, setCq] = createSignal("0");
    const [gop, setGop] = createSignal("-1");
    const [bframe, setBframe] = createSignal("3");
    const [bRefMode, setBRefMode] = createSignal("middle");
    const [qMin, setQMin] = createSignal("0");
    const [qMax, setQMax] = createSignal("-1");
    const [advancedOptions, setAdvancedOptions] = createSignal(false);

    onMount(() => {
        onParamChanged("hwaccel", "cuda");
    });

    createEffect(() => {
        let rc = rateControl();
        let opts: ProgramFFmpegArguments = {
            global: {
                hwaccel_output_format: "cuda",
            },
            output: {
                tune: tune(),
                rc,
                lookahead: lookahead(),
                g: gop() === "-1" ? undefined : gop(),
                bf: bframe() === "-1" ? undefined : bframe(),
                b_ref_mode: bRefMode(),
                qmin: qMin(),
                qmax: qMax(),
            },
        };

        if (temporalAq()) {
            opts.output!["temporal_aq"] = "1";
        }

        if (spatialAq()) {
            opts.output!["spatial_aq"] = "1";
            opts.output!["aq-strength"] = aqStrength();
        }

        if (qp() !== "-1") {
            opts.output!["qp"] = qp();
        }

        // Use vbr because vbr-cq doesn't actually exist
        if (rc === "vbr-cq") {
            opts.output!.rc = "vbr";
            opts.output!.cq = cq();
        }

        if (rc !== "constqp") {
            if (rc === "vbr-cq") {
                onParamChanged("vbitrate", 0);
            } else {
                onParamChanged("vbitrate", parseInt(bitrate()));
            }

            if (bufSize() != "-1") {
                opts.output!["bufsize"] = bufSize() + "k";
            }

            if (opts.output!.rc === "vbr" && maxRate() !== "-1") {
                opts.output!["maxrate"] = maxRate() + "k";
            } else if (rc === "cbr") {
                opts.output!["maxrate"] = bitrate() + "k";
            }
        } else {
            onParamChanged("vbitrate", undefined);
        }

        onParamChanged("extraopts", opts);
    });

    return (
        <>
            <section id="encoderOptions" class="k-form">
                <Show when={codec?.shortName === "av1"}>
                    <label for="hardwareSupport">Hardware Support</label>
                    <div class="flex items-center">
                        <HelpButton
                            title="Please note that only NVIDIA 40 series cards and newer supports AV1 encoding."
                            url="https://developer.nvidia.com/video-encode-decode-support-matrix"
                        />
                    </div>
                </Show>
                <label for="preset">Preset</label>
                <select
                    name="preset"
                    id="preset"
                    class="k-dropdown"
                    value={params.preset ?? "p4"}
                    oninput={(e) => onParamChanged("preset", e.target.value)}
                >
                    <option value="p1">P1 - Fastest (Lowest Quality)</option>
                    <option value="p2">P2 - Faster (Lower Quality)</option>
                    <option value="p3">P3 - Fast (Low Quality)</option>
                    <option value="p4">P4 - Medium (Default)</option>
                    <option value="p5">P5 - Slow (Good Quality)</option>
                    <option value="p6">P6 - Slower (Better Quality)</option>
                    <option value="p7">P7 - Slowest (Best Quality)</option>
                </select>
                <label for="rateControl">Rate Control Mode</label>
                <select
                    name="rateControl"
                    id="rateControl"
                    class="k-dropdown"
                    value={rateControl()}
                    oninput={(e) => setRateControl(e.target.value)}
                >
                    <option value="constqp">Constant QP</option>
                    <option value="vbr">Variable Bitrate</option>
                    <option value="vbr-cq">
                        Variable Bitrate, Constant Quality
                    </option>
                    <option value="cbr">Constant Bitrate</option>
                </select>
                <Show when={rateControl() === "constqp"}>
                    <label for="qp">QP</label>
                    <input
                        type="number"
                        name="qp"
                        id="qp"
                        min="-1"
                        max="51"
                        value={qp()}
                        onInput={(e) => setQp(e.target.value)}
                        title="Quantization Parameter, Range from -1 to 51. Leave at -1 to not specify."
                    />
                </Show>
                <Show when={rateControl() === "vbr-cq"}>
                    <label for="cq">Quality Level</label>
                    <input
                        type="number"
                        name="cq"
                        id="cq"
                        min="0"
                        max="51"
                        value={cq()}
                        onInput={(e) => setCq(e.target.value)}
                        title="Target quality level. Range from 0 to 51, 0 meaning automatic."
                    />
                </Show>
                <Show when={rateControl() === "vbr" || rateControl() === "cbr"}>
                    <label for="vbitrate">Bitrate</label>
                    <RateInput
                        name="vbitrate"
                        id="vbitrate"
                        title="Target (average) bitrate"
                        value={bitrate()}
                        onInput={(e) => setBitrate(e.target.value)}
                    />
                </Show>
                <Show
                    when={rateControl() === "vbr" || rateControl() === "vbr-cq"}
                >
                    <label for="bufsize">Buffer Size</label>
                    <RateInput
                        name="bufsize"
                        id="bufsize"
                        min="-1"
                        title="Use -1 to not specify"
                        value={bufSize()}
                        onInput={(e) => setBufSize(e.target.value)}
                        help="Decoder buffer size. Generally should be half or same as the bitrate for normal high-quality transcoding."
                        helpUrl="https://superuser.com/a/946343"
                    />
                    <label for="maxrate">Max Bitrate</label>
                    <RateInput
                        name="maxrate"
                        id="maxrate"
                        min="-1"
                        title="Maximum bitrate. Use -1 to not specify."
                        value={maxRate()}
                        onInput={(e) => setMaxRate(e.target.value)}
                    />
                </Show>
                <div></div>
                <div class="checkbox-container">
                    <input
                        type="checkbox"
                        name="advancedOptions"
                        id="advancedOptions"
                        checked={advancedOptions()}
                        onInput={(e) => setAdvancedOptions(e.target.checked)}
                    />
                    <label for="advancedOptions">Show Advanced Options</label>
                </div>
                <Show when={advancedOptions()}>
                    <label for="qmin">Minimum QP</label>
                    <input
                        type="number"
                        name="qmin"
                        id="qmin"
                        min="-1"
                        max="51"
                        value={qMin()}
                        onInput={(e) => setQMin(e.target.value)}
                    />
                    <label for="qmax">Maximum QP</label>
                    <input
                        type="number"
                        name="qmax"
                        id="qmax"
                        min="-1"
                        max="51"
                        value={qMax()}
                        onInput={(e) => setQMax(e.target.value)}
                    />
                    <label for="iqfactor">I QP Factor</label>
                    <input
                        type="number"
                        name="iqfactor"
                        id="iqfactor"
                        min="-1"
                        value={params.i_qfactor ?? "0.75"}
                        onInput={(e) =>
                            onParamChanged(
                                "i_qfactor",
                                parseFloat(e.target.value),
                            )
                        }
                    />
                    <label for="bqfactor">B QP Factor</label>
                    <input
                        type="number"
                        name="bqfactor"
                        id="bqfactor"
                        min="-1"
                        value={params.b_qfactor ?? "1.1"}
                        onInput={(e) =>
                            onParamChanged(
                                "b_qfactor",
                                parseFloat(e.target.value),
                            )
                        }
                    />
                    <label for="tune">Tune</label>
                    <select
                        name="tune"
                        id="tune"
                        class="k-dropdown"
                        value={tune()}
                        oninput={(e) => setTune(e.target.value)}
                    >
                        <option value="hq">High Quality</option>
                        <option value="ll">Low Latency</option>
                        <option value="ull">Ultra Low Latency</option>
                        <option value="lossless">Lossless</option>
                    </select>
                    <label for="lookahead">Lookahead</label>
                    <div class="flex gap2">
                        <input
                            type="number"
                            name="lookahead"
                            id="lookahead"
                            class="col"
                            value={lookahead()}
                            oninput={(e) => setLookahead(e.target.value)}
                        />
                        <HelpButton
                            title="Improves rate-control accuracy, Set to 0 to disable. Click to view full details."
                            url="https://docs.nvidia.com/video-technologies/video-codec-sdk/12.2/ffmpeg-with-nvidia-gpu/index.html#lookahead"
                        />
                    </div>
                    <label for="gop">GOP size</label>
                    <input
                        type="number"
                        name="gop"
                        id="gop"
                        min="-1"
                        title="Leave at -1 to not specify"
                        value={gop()}
                        onInput={(e) => setGop(e.target.value)}
                    />
                    <label for="bframe">B-frames</label>
                    <input
                        type="number"
                        name="bframe"
                        id="bframe"
                        value={bframe()}
                        onInput={(e) => setBframe(e.target.value)}
                        title="Number of B-frames between I and P-frames. Use -1 to not specify."
                    />
                    <label for="bRefMode">B-frames Reference Mode</label>
                    <select
                        name="bRefMode"
                        id="bRefMode"
                        class="k-dropdown"
                        value={bRefMode()}
                        onInput={(e) => setBRefMode(e.target.value)}
                    >
                        <option
                            value="disabled"
                            title="B frames will not be used for reference."
                        >
                            Disabled
                        </option>
                        <option
                            value="each"
                            title="Each B frame will be used for reference"
                        >
                            Each
                        </option>
                        <option
                            value="middle"
                            title="Only (number of B frames)/2 will be used for reference."
                        >
                            Middle
                        </option>
                    </select>
                </Show>
            </section>
            <Show when={advancedOptions()}>
                <div class="row flex-col align-items-center">
                    <h3 class="k-form-section-title">
                        Adaptive Quantization (AQ)
                    </h3>
                </div>
                <section id="adaptiveQuantization" class="k-form">
                    <label>Help</label>
                    <div class="flex items-center">
                        <HelpButton
                            title="Improves quality by helping adjust the QP. Click to view full details"
                            url="https://docs.nvidia.com/video-technologies/video-codec-sdk/12.2/ffmpeg-with-nvidia-gpu/index.html#adaptive-quantization-aq"
                        />
                    </div>
                    <div></div>
                    <div class="checkbox-container">
                        <input
                            type="checkbox"
                            name="temporalAq"
                            id="temporalAq"
                            checked={temporalAq()}
                            onInput={(e) => setTemporalAq(e.target.checked)}
                        />
                        <label
                            for="temporalAq"
                            title="Improve quality based on the motion within the frame"
                        >
                            Temporal AQ
                        </label>
                    </div>
                    <div></div>
                    <div class="checkbox-container">
                        <input
                            type="checkbox"
                            name="spatialAq"
                            id="spatialAq"
                            checked={spatialAq()}
                            onInput={(e) => setSpatialAq(e.target.checked)}
                        />
                        <label
                            for="spatialAq"
                            title="Put a bias on specific areas in a frame"
                        >
                            Spatial AQ
                        </label>
                    </div>
                    <Show when={spatialAq()}>
                        <label for="aqStrength">AQ Strength</label>
                        <input
                            type="number"
                            name="aqStrength"
                            id="aqStrength"
                            value={aqStrength()}
                            oninput={(e) => setAqStrength(e.target.value)}
                        />
                    </Show>
                </section>
            </Show>
        </>
    );
}

export default NvEncOptions;
