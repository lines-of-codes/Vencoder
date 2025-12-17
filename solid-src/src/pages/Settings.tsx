import { events } from "@neutralinojs/lib";
import { createSignal, onCleanup, onMount, Show } from "solid-js";

function Settings() {
    const [windowFocused, setWindowFocused] = createSignal(true);
    const [useSystemFFmpeg, setUseSystemFFmpeg] = createSignal(true);
    const [useFFplay, setUseFFplay] = createSignal(true);
    const [ffmpegPath, setFfmpegPath] = createSignal("");

    function windowIsFocused() {
        setWindowFocused(false);
    }

    function windowUnfocused() {
        setWindowFocused(true);
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);
    });

    onCleanup(() => {
        events.off("windowFocus", windowIsFocused);
        events.off("windowBlur", windowUnfocused);
    });

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
                            value={useFFplay().toString()}
                            onInput={(e) =>
                                setUseFFplay(e.currentTarget.checked)
                            }
                            checked
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
                        <button class="k-button k-form-button">Download</button>
                    </Show>
                </div>
            </div>
            <footer class="p-medium">
                <button class="k-button">Save Changes</button>
            </footer>
        </main>
    );
}

export default Settings;
