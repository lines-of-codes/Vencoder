import { events } from "@neutralinojs/lib";
import {
    createEffect,
    createSignal,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch,
    type Signal,
} from "solid-js";
import {
    generateOutputCommand,
    getAvailableCodecs,
    getLengthMicroseconds,
    playFile,
    videoFileExtensions,
    type CodecInfo,
    type FFmpegParams,
} from "./util/ffmpeg";
import Neutralino from "@neutralinojs/lib";
import H264Options from "./components/H264Options";
import { openFile } from "./util/oshelper";
import { getTemporaryFilePath } from "./util/path";
import { generateRandomString } from "./util/string";
import "./css/icons.css";
import BreezeIcon from "./components/BreezeIcon";

const commonCodecs = new Set(["h264", "hevc", "vp8", "vp9", "av1", "dnxhd"]);

interface RunningProcessInfo {
    process: Neutralino.os.SpawnedProcess;
    file: string;
    length: number;
}

function App() {
    const [windowFocused, setWindowFocused] = createSignal(true);
    const [displayedCodecs, setDisplayedCodecs]: Signal<CodecInfo[]> =
        createSignal([] as CodecInfo[]);
    const [fileList, setFileList] = createSignal([
        "/home/satakunu/Videos/litetask_demo.mkv",
    ]);
    const [selectedClip, setSelectedClip] = createSignal("");
    const [outputCommand, setOutputCommand] = createSignal(
        "ffmpeg -i {filename}",
    );
    const [showCommonCodecs, setShowCommonCodecs] = createSignal(true);
    const [selectedCodec, setSelectedCodec] = createSignal<CodecInfo>();
    const [selectedEncoder, setSelectedEncoder] = createSignal("");
    const [runningProcesses, setRunningProcesses] = createSignal<
        RunningProcessInfo[]
    >([]);
    const logs: { [id: number]: string[] } = {};
    let supportedCodecs: CodecInfo[] = [];
    let ffmpegParams: FFmpegParams = { vcodec: "" };
    let successfulCount = 0;
    let unsuccessfulCount = 0;
    let totalCount = 0;

    function windowIsFocused() {
        setWindowFocused(true);
    }

    function windowUnfocused() {
        setWindowFocused(false);
    }

    function handleSpawnedProcessEvents(evt: CustomEvent) {
        switch (evt.detail.action) {
            case "stdErr":
                logs[evt.detail.id].push(evt.detail.data);
                break;
            case "exit":
                if (evt.detail.data === 0) {
                    successfulCount += 1;
                } else {
                    unsuccessfulCount += 1;

                    // If the exit code isn't 255 (the exit code of the program exiting because of cancellation)
                    if (evt.detail.data !== 255) {
                        Neutralino.os.showNotification(
                            "File Encoding Failed",
                            `Encoding for file "${runningProcesses()?.find((v) => v.process.id == evt.detail.id)?.file}" failed. Exit code ${evt.detail.data}.`,
                        );

                        const tempFilename = `${getTemporaryFilePath()}/vencoder-ffmpeg-${generateRandomString(8)}.log`;
                        Neutralino.filesystem.writeFile(
                            tempFilename,
                            logs[evt.detail.id].join("\n"),
                        );
                        openFile(tempFilename);
                    }
                }

                if (successfulCount + unsuccessfulCount === totalCount) {
                    Neutralino.os.showNotification(
                        "File(s) encoded.",
                        `${successfulCount} files encoded successfully. ${unsuccessfulCount} failed or cancelled.`,
                    );
                    successfulCount = 0;
                    unsuccessfulCount = 0;
                    totalCount = 0;
                }

                console.log(`FFmpeg exited with code: ${evt.detail.data}`);
                break;
        }
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);
        events.on("spawnedProcess", handleSpawnedProcessEvents);

        supportedCodecs = await getAvailableCodecs();
        filterDisplayedCodecs();

        const firstCodec = displayedCodecs()[0];

        setSelectedCodec(firstCodec);
        setSelectedEncoder(firstCodec.encoders[0]);
    });

    onCleanup(() => {
        events.off("windowFocus", windowIsFocused);
        events.off("windowBlur", windowUnfocused);
        events.off("spawnedProcess", handleSpawnedProcessEvents);
    });

    function removeBtnClicked() {
        if (selectedClip() === "") return;

        const list = fileList();
        const targetClip = selectedClip();
        setFileList(list.filter((v) => v !== targetClip));
        setSelectedClip("");
    }

    function removeAllBtnClicked() {
        setFileList([]);
        setSelectedClip("");
    }

    function playBtnClicked() {
        playFile(selectedClip());
    }

    async function openBtnClicked() {
        const filePaths = await Neutralino.os.showOpenDialog("Select Videos", {
            multiSelections: true,
            filters: [
                {
                    extensions: ["mp4", "mkv", "mov", "webm"],
                    name: "Common Video Files",
                },
                {
                    extensions: ["*"],
                    name: "All Files",
                },
            ],
        });
        setFileList(Array.from(new Set([...fileList(), ...filePaths])));
    }

    function filterDisplayedCodecs() {
        if (showCommonCodecs()) {
            setDisplayedCodecs(
                supportedCodecs.filter((v) => commonCodecs.has(v.shortName)),
            );
            return;
        }

        setDisplayedCodecs(supportedCodecs);
    }

    function showCommonCodecsChanged(e: InputEvent) {
        const newValue = (e.target as HTMLInputElement).checked;
        setShowCommonCodecs(newValue);
        filterDisplayedCodecs();
    }

    function selectedCodecsChanged(e: InputEvent) {
        const newValue = (e.target as HTMLInputElement).value;
        const codecObj = displayedCodecs().find(
            (v) => v.shortName === newValue,
        );

        if (newValue !== "h264" && newValue !== "hevc") {
            ffmpegParams.twopass = false;
        }

        setSelectedCodec(codecObj);
        let encoder = newValue;
        if (codecObj?.encoders.length !== 0) {
            encoder = codecObj?.encoders[0] ?? "";
        }
        setSelectedEncoder(encoder);
    }

    function onParametersChanged(key: string, value: any) {
        // @ts-ignore
        ffmpegParams[key] = value;
        setOutputCommand(generateOutputCommand(ffmpegParams));
    }

    function settingsBtnPressed() {
        Neutralino.window.create(`${window.location.href}settings`, {
            width: 800,
            height: 600,
            x: 120,
            y: 120,
            injectGlobals: true,
        });
    }

    createEffect(() => {
        let encoder: string | undefined = selectedEncoder();

        if (encoder === "") {
            encoder = undefined;
        }

        ffmpegParams = {
            vcodec: selectedCodec()?.shortName ?? "",
            encoder,
            acodec: ffmpegParams.acodec,
            abitrate: ffmpegParams.abitrate,
            crf: ffmpegParams.crf,
            doNotUseAn: ffmpegParams.doNotUseAn,
            faststart: ffmpegParams.faststart,
            hwaccel: ffmpegParams.hwaccel,
            inputFile: undefined,
            preset: ffmpegParams.preset,
            twopass: ffmpegParams.twopass,
            vbitrate: ffmpegParams.vbitrate,
        };

        setOutputCommand(generateOutputCommand(ffmpegParams));
    });

    async function convertClip(
        clip: string,
    ): Promise<RunningProcessInfo | undefined> {
        ffmpegParams.inputFile = clip;

        const fileName = (await Neutralino.filesystem.getPathParts(clip)).stem;

        const fileExt =
            videoFileExtensions[selectedCodec()?.shortName ?? ""] ?? "";

        switch (window.NL_OS) {
            case "Linux":
                ffmpegParams.outputFile = `${await Neutralino.os.getEnv("HOME")}/Vencoder/${fileName}.${fileExt}`;
                break;
            case "Windows":
                ffmpegParams.outputFile = `${await Neutralino.os.getEnv("HOMEPATH")}\\Vencoder\\${fileName}.${fileExt}`;
                break;
        }

        const outputDir = (
            await Neutralino.filesystem.getPathParts(
                ffmpegParams.outputFile ?? "",
            )
        ).parentPath;
        try {
            await Neutralino.filesystem.getStats(outputDir);
        } catch (e) {
            console.log(e);
            await Neutralino.filesystem.createDirectory(outputDir);
        }

        try {
            await Neutralino.filesystem.getStats(ffmpegParams.outputFile ?? "");
            const userAnswer = await Neutralino.os.showMessageBox(
                "File already exists",
                `A file at ${ffmpegParams.outputFile} already exists. Would you like to overwrite it?`,
                Neutralino.os.MessageBoxChoice.YES_NO,
                Neutralino.os.Icon.QUESTION,
            );

            if (userAnswer === "NO") {
                return;
            }
        } catch (e) {}

        const length = await getLengthMicroseconds(clip);

        return {
            process: await Neutralino.os.spawnProcess(
                generateOutputCommand(ffmpegParams),
            ),
            file: clip,
            length,
        };
    }

    async function convertAllClicked() {
        const list = fileList();

        totalCount = list.length;

        const processes = (await Promise.all(list.map(convertClip))).filter(
            (v) => v !== undefined,
        );

        setRunningProcesses(processes);

        processes.forEach((v) => (logs[v.process.id] = []));

        await Neutralino.storage.setData(
            "filesBeingProcessed",
            JSON.stringify(
                processes.map((v) => ({
                    id: v.process.id,
                    in: v.file,
                    len: v.length,
                })),
            ),
        );

        await Neutralino.window.create(`${window.location.href}progress`, {
            width: 600,
            height: 400,
            x: 120,
            y: 120,
            injectGlobals: true,
            maximizable: false,
        });
    }

    async function convertSelectedClicked() {
        const result = await convertClip(selectedClip());

        if (result === undefined) {
            return;
        }

        console.log(result);

        totalCount = 1;

        setRunningProcesses([result]);

        logs[result.process.id] = [];

        await Neutralino.storage.setData(
            "filesBeingProcessed",
            JSON.stringify([
                {
                    id: result.process.id,
                    in: result.file,
                    len: result.length,
                },
            ]),
        );

        await Neutralino.window.create(`${window.location.href}progress`, {
            width: 600,
            height: 400,
            x: 120,
            y: 120,
            injectGlobals: true,
            maximizable: false,
        });
    }

    return (
        <main class="row flex-col">
            <div class="container" style={{ flex: "1" }}>
                <div class="row h-full">
                    <div class="row flex-col h-full">
                        <header
                            class={`k-page-header k-rborder ${windowFocused() ? "" : "window-blur"}`}
                        >
                            <div class="page-title">Vencoder</div>
                        </header>
                        <div
                            class="row flex-col gap2 k-white-sidebar k-rborder h-full"
                            style={{ padding: "8px" }}
                        >
                            <ul class="k-list-view bordered col">
                                <For each={fileList()}>
                                    {(item, _) => (
                                        <li
                                            class={
                                                item == selectedClip()
                                                    ? "selected"
                                                    : ""
                                            }
                                            onclick={() =>
                                                setSelectedClip(item)
                                            }
                                        >
                                            {item}
                                        </li>
                                    )}
                                </For>
                            </ul>
                            <div class="row gap2">
                                <button
                                    onclick={openBtnClicked}
                                    class="k-button"
                                >
                                    Open...
                                </button>
                                <button
                                    onclick={removeAllBtnClicked}
                                    class="k-button"
                                >
                                    Remove All
                                </button>
                                <button
                                    disabled={selectedClip() === ""}
                                    onclick={removeBtnClicked}
                                    class="icon-button k-button"
                                >
                                    <BreezeIcon
                                        icon="b b-trash-empty"
                                        alt="Remove Selected Video"
                                    />
                                </button>
                                <button
                                    disabled={selectedClip() === ""}
                                    onclick={playBtnClicked}
                                    class="icon-button k-button"
                                >
                                    <BreezeIcon
                                        icon="playback-start"
                                        alt="Preview Selected Video"
                                    />
                                </button>
                                <button
                                    class="icon-button k-button"
                                    onclick={settingsBtnPressed}
                                >
                                    <BreezeIcon
                                        icon="configure"
                                        alt="Configure"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="row flex-col h-full" style={{ width: "100%" }}>
                        <header
                            class={`k-page-header ${windowFocused() ? "" : "window-blur"}`}
                        >
                            <div class="page-title">Conversion Settings</div>
                        </header>
                        <div
                            class="col row flex-col"
                            style={{
                                padding:
                                    "var(--k-grid-unit) var(--k-small-spacing)",
                                flex: "1",
                            }}
                        >
                            <div>
                                <form
                                    class="k-form"
                                    onsubmit={(e) => e.preventDefault()}
                                >
                                    <label for="targetCodec">Codec</label>
                                    <select
                                        class="k-dropdown"
                                        id="targetCodec"
                                        oninput={selectedCodecsChanged}
                                    >
                                        <For each={displayedCodecs()}>
                                            {(item, _) => (
                                                <option value={item.shortName}>
                                                    {item.description}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <div></div>
                                    <div class="checkbox-container">
                                        <input
                                            type="checkbox"
                                            name="commonCodecs"
                                            id="commonCodecs"
                                            oninput={showCommonCodecsChanged}
                                            checked
                                        />
                                        <label for="commonCodecs">
                                            Only show common codecs
                                        </label>
                                    </div>
                                    <Show
                                        when={
                                            selectedCodec()?.encoders.length !==
                                            0
                                        }
                                    >
                                        <label>Encoder</label>
                                        <select
                                            name="videoEncoder"
                                            id="videoEncoder"
                                            class="k-dropdown"
                                            value={selectedEncoder()}
                                            oninput={(e) =>
                                                setSelectedEncoder(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <For
                                                each={selectedCodec()?.encoders}
                                            >
                                                {(item, _) => (
                                                    <option>{item}</option>
                                                )}
                                            </For>
                                        </select>
                                    </Show>
                                </form>
                                <Switch fallback={<div></div>}>
                                    <Match
                                        when={
                                            selectedCodec()?.shortName ===
                                                "h264" ||
                                            selectedCodec()?.shortName ===
                                                "hevc"
                                        }
                                    >
                                        <H264Options
                                            codec={selectedCodec()}
                                            params={ffmpegParams}
                                            onParamChanged={onParametersChanged}
                                        />
                                    </Match>
                                </Switch>
                            </div>
                            <div class="row flex-col p-medium">
                                <label for="outputCommand">Command</label>
                                <pre
                                    id="outputCommand"
                                    class="k-text-field w-full col"
                                >
                                    {outputCommand()}
                                </pre>
                            </div>
                        </div>
                        <footer class="k-page-footer row gap2">
                            <button
                                class="k-button"
                                onclick={convertAllClicked}
                            >
                                Convert All
                            </button>
                            <button
                                class="k-button"
                                onclick={convertSelectedClicked}
                                disabled={selectedClip() === ""}
                            >
                                Convert Selected
                            </button>
                        </footer>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default App;
