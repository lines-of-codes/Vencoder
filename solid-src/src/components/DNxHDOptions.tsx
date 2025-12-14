import { os } from "@neutralinojs/lib";
import {
    type CodecInfo,
    type FFmpegParamChangedFunc,
    type FFmpegParams,
} from "../util/ffmpeg";
import BreezeIcon from "./BreezeIcon";

/**
 * Options for H.264/H.265 codecs
 */
function DNxHDOptions(props: {
    codec: CodecInfo | undefined;
    params: FFmpegParams;
    onParamChanged: FFmpegParamChangedFunc;
}) {
    return (
        <section id="commonLossyOptions" class="k-form">
            <label>Help</label>
            <div class="flex items-center">
                <button
                    class="icon-button"
                    onclick={() => os.open("https://askubuntu.com/a/907515")}
                    title="DNxHD is a picky encoder."
                >
                    <BreezeIcon icon="help-about" alt="Help" />
                </button>
            </div>
            <label for="profile">Profile</label>
            <select
                class="k-dropdown"
                name="profile"
                id="profile"
                value={props.params.extraopts.output?.profile ?? "dnxhd"}
                oninput={(e) => {
                    props.onParamChanged("extraopts", {
                        output: { profile: e.target.value },
                    });
                }}
            >
                <option value="dnxhd">DNxHD</option>
                <option value="dnxhr_444">DNxHR 444</option>
                <option value="dnxhr_hqx">DNxHR HQX</option>
                <option value="dnxhr_hq">DNxHR HQ</option>
                <option value="dnxhr_sq">DNxHR SQ</option>
                <option value="dnxhr_lb">DNxHR LB</option>
            </select>
        </section>
    );
}

export default DNxHDOptions;
