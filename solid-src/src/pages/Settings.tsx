import { downloadFFmpeg } from "@/util/downloadFFmpeg";
import { loadSettings, saveSettings } from "@/util/settings";
import { events } from "@neutralinojs/lib";
import {
    createEffect,
    createSignal,
    on,
    onCleanup,
    onMount,
    Show,
} from "solid-js";

function Settings() {
    const [windowFocused, setWindowFocused] = createSignal(true);
    const [useSystemFFmpeg, setUseSystemFFmpeg] = createSignal(true);
    const [useFFplay, setUseFFplay] = createSignal(false);
    const [ffmpegPath, setFfmpegPath] = createSignal("");
    const [isDownloading, setIsDownloading] = createSignal(false);

    function windowIsFocused() {
        setWindowFocused(false);
    }

    function windowUnfocused() {
        setWindowFocused(true);
    }

    async function downloadBtnClicked() {
        setIsDownloading(true);
        await downloadFFmpeg();
        setIsDownloading(false);
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);
        const settings = await loadSettings();
        setUseFFplay(settings.ffplay);
        setUseSystemFFmpeg(settings.ffpath === null);

        if (settings.ffpath !== null) {
            setFfmpegPath(settings.ffpath);
        }
    });

    onCleanup(() => {
        events.off("windowFocus", windowIsFocused);
        events.off("windowBlur", windowUnfocused);
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
            <header
                class={`k-page-header ${windowFocused() ? "" : "window-blur"}`}
                style={{ width: "100vw" }}
            >
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
                    <div></div>
                    <div class="checkbox-container">
                        <input
                            id="useSystemFFmpeg"
                            type="checkbox"
                            value={useSystemFFmpeg().toString()}
                            onInput={(e) =>
                                setUseSystemFFmpeg(e.currentTarget.checked)
                            }
                            checked
                        />
                        <label for="useSystemFFmpeg">
                            Use system's FFmpeg installation
                        </label>
                    </div>
                    <Show when={!useSystemFFmpeg()}>
                        <label for="ffmpegPath">FFmpeg Path</label>
                        <input
                            type="text"
                            value={ffmpegPath()}
                            onInput={(e) =>
                                setFfmpegPath(e.currentTarget.value)
                            }
                        />
                        <div></div>
                        <button
                            class="k-button k-form-button"
                            onclick={downloadBtnClicked}
                        >
                            Download
                        </button>
                    </Show>
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
