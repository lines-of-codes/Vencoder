import { downloadFFmpeg } from "@/util/downloadFFmpeg";
import { loadSettings, saveSettings } from "@/util/settings";
import { os } from "@neutralinojs/lib";
import {
    createEffect,
    createSignal,
    on,
    onMount,
    Show,
} from "solid-js";

function Settings() {
    const [useFFplay, setUseFFplay] = createSignal(false);
    const [ffmpegPath, setFfmpegPath] = createSignal("");
    const [isDownloading, setIsDownloading] = createSignal(false);

    async function downloadBtnClicked() {
        setIsDownloading(true);
        await downloadFFmpeg();
        setIsDownloading(false);
    }

    async function browseBtnClicked() {
        const entries = await os.showOpenDialog("Select ffmpeg binary");

        if (entries.length === 0) return;

        setFfmpegPath(entries[0]);
    }

    onMount(async () => {
        const settings = await loadSettings();
        setUseFFplay(settings.ffplay);

        if (settings.ffpath !== null) {
            setFfmpegPath(settings.ffpath);
        }
    });

    createEffect(
        on(
            [useFFplay, ffmpegPath],
            async () => {
                const ffpath = ffmpegPath();

                await saveSettings({
                    ffplay: useFFplay(),
                    ffpath: ffpath === "" ? null : ffpath,
                });
            },
            { defer: true },
        ),
    );

    return (
        <main class="row flex-col container">
            <header class="k-page-header" style={{ width: "100vw" }}>
                <div class="page-title" role="heading">
                    Settings
                </div>
            </header>
            <div class="p-medium col">
                <div class="row flex-col align-items-center">
                    <h2 class="k-form-section-title">FFmpeg</h2>
                </div>
                <div class="k-form">
                    <div></div>
                    <div class="checkbox-container">
                        <input
                            id="useFFplay"
                            type="checkbox"
                            checked={useFFplay()}
                            onInput={(e) =>
                                setUseFFplay(e.currentTarget.checked)
                            }
                        />
                        <label for="useFFplay">
                            Use <code>ffplay</code> instead of system's default
                            media player
                        </label>
                    </div>
                    <label for="ffmpegPath">FFmpeg Path</label>
                    <input
                        type="text"
                        value={ffmpegPath()}
                        onInput={(e) => setFfmpegPath(e.currentTarget.value)}
                        title="Path to the FFmpeg binary. Leave empty to use the system's install (if available)."
                        placeholder="Use system's install"
                    />
                    <div></div>
                    <div class="flex gap2" style="max-width: 16em;">
                        <button
                            class="k-button k-form-button col"
                            onclick={browseBtnClicked}
                        >
                            Browse...
                        </button>
                        <button
                            class="k-button k-form-button col"
                            onclick={downloadBtnClicked}
                        >
                            Download
                        </button>
                    </div>
                    <Show when={isDownloading()}>
                        <div></div>
                        <div>FFmpeg is being downloaded, Please wait!</div>
                    </Show>
                </div>
            </div>
            <footer class="p-medium"></footer>
        </main>
    );
}

export default Settings;
