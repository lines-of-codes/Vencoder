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
    getPixelFormats,
    playFile,
    videoFileExtensions,
    type CodecInfo,
    type CodecList,
    type FFmpegParams,
} from "./util/ffmpeg";
import Neutralino from "@neutralinojs/lib";
import H264Options from "./components/H264Options";
import { openFile } from "./util/oshelper";
import { getTemporaryFilePath, getVencoderFolder } from "./util/path";
import { generateRandomString } from "./util/string";
import "./css/icons.css";
import BreezeIcon from "./components/BreezeIcon";
import AV1Options from "./components/AV1Options";
import DNxHDOptions from "./components/DNxHDOptions";

const commonCodecs = new Set(["h264", "hevc", "vp8", "vp9", "av1", "dnxhd"]);

interface RunningProcessInfo {
    process: Neutralino.SpawnedProcess;
    file: string;
    length: number;
}

function App() {
    const [windowFocused, setWindowFocused] = createSignal(true);
    const [displayedCodecs, setDisplayedCodecs]: Signal<CodecInfo[]> =
        createSignal([] as CodecInfo[]);
    const [audioCodecList, setAudioCodecList] = createSignal([] as CodecInfo[]);
    const [fileList, setFileList] = createSignal([] as string[]);
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
    const [customFileExt, setCustomFileExt] = createSignal("");
    const [globalopts, setGlobalopts] = createSignal("");
    const [inputopts, setInputopts] = createSignal("");
    const [outputopts, setOutputopts] = createSignal("");
    const [audioCodec, setAudioCodec] = createSignal("copy");
    const [audioEncoder, setAudioEncoder] = createSignal("");
    const [pixelFormatList, setPixelFormatList] = createSignal([] as string[]);
    const [pixelFormat, setPixelFormat] = createSignal("");
    const logs: { [id: number]: string[] } = {};
    let supportedCodecs: CodecList = { vcodecs: [], acodecs: [] };
    let ffmpegParams: FFmpegParams = {
        vcodec: "",
        useropts: {
            global: "",
            input: "",
            output: "",
        },
    };
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
        setAudioCodecList(supportedCodecs.acodecs);

        const firstCodec = displayedCodecs()[0];

        ffmpegParams.vcodec = firstCodec.shortName;
        ffmpegParams.encoder = firstCodec.encoders[0];
        setSelectedCodec(firstCodec);
        setSelectedEncoder(firstCodec.encoders[0]);

        setPixelFormatList(await getPixelFormats());
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
                supportedCodecs.vcodecs.filter((v) =>
                    commonCodecs.has(v.shortName),
                ),
            );
            return;
        }

        setDisplayedCodecs(supportedCodecs.vcodecs);
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

        ffmpegParams = {
            vcodec: codecObj?.shortName ?? "",
            useropts: {
                global: "",
                input: "",
                output: "",
            },
        };

        let encoder = newValue;
        if (codecObj?.encoders.length !== 0) {
            encoder = codecObj?.encoders[0] ?? "";
        }
        ffmpegParams.encoder = encoder;
        setSelectedCodec(codecObj);
        setSelectedEncoder(encoder);
    }

    function getAudioEncoders() {
        const codec = audioCodec();
        let encoders = audioCodecList().find(
            (v) => v.shortName === codec,
        )?.encoders;

        if (encoders) {
            setAudioEncoder(encoders[0]);
        }

        if (encoders instanceof Array && encoders.length === 0) {
            encoders = undefined;
        }

        return encoders;
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

        let acodec = audioEncoder();

        if (acodec === "") {
            acodec = audioCodec();
        }

        const pixFmt = pixelFormat();

        ffmpegParams = {
            vcodec: selectedCodec()?.shortName ?? "",
            encoder,
            acodec,
            abitrate: ffmpegParams.abitrate,
            crf: ffmpegParams.crf,
            doNotUseAn: ffmpegParams.doNotUseAn,
            faststart: ffmpegParams.faststart,
            hwaccel: ffmpegParams.hwaccel,
            inputFile: undefined,
            preset: ffmpegParams.preset,
            twopass: ffmpegParams.twopass,
            vbitrate: ffmpegParams.vbitrate,
            useropts: {
                global: globalopts(),
                input: inputopts(),
                output: outputopts(),
            },
            pixelFormat: pixFmt === "" ? undefined : pixFmt,
        };

        setOutputCommand(generateOutputCommand(ffmpegParams));
    });

    async function convertClip(
        clip: string,
    ): Promise<RunningProcessInfo | undefined> {
        ffmpegParams.inputFile = clip;

        const fileName = (await Neutralino.filesystem.getPathParts(clip)).stem;

        const customExt = customFileExt();

        const fileExt =
            customExt === ""
                ? videoFileExtensions[selectedCodec()?.shortName ?? ""]
                : customExt;

        ffmpegParams.outputFile = `${await getVencoderFolder()}${fileName}.${fileExt}`;

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
                Neutralino.MessageBoxChoice.YES_NO,
                Neutralino.Icon.QUESTION,
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
            enableInspector: false,
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
            enableInspector: false,
        });
    }

    return (
        <main class="row">
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
                                        item == selectedClip() ? "selected" : ""
                                    }
                                    onclick={() => setSelectedClip(item)}
                                >
                                    {item}
                                </li>
                            )}
                        </For>
                    </ul>
                    <div class="row gap2">
                        <button onclick={openBtnClicked} class="k-button">
                            Open...
                        </button>
                        <button onclick={removeAllBtnClicked} class="k-button">
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
                            <BreezeIcon icon="configure" alt="Configure" />
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
                <div class="page-content">
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
                            <label for="fileExt">File Extension</label>
                            <input
                                type="text"
                                name="fileExt"
                                id="fileExt"
                                title="File extension without the dot. Leave blank to guess from codec."
                                value={customFileExt()}
                                oninput={(e) =>
                                    setCustomFileExt(e.target.value)
                                }
                                placeholder="Leave blank to guess from codec"
                            />
                            <Show when={selectedCodec()?.encoders.length !== 0}>
                                <label for="videoEncoder">Encoder</label>
                                <select
                                    name="videoEncoder"
                                    id="videoEncoder"
                                    class="k-dropdown"
                                    value={selectedEncoder()}
                                    oninput={(e) =>
                                        setSelectedEncoder(e.target.value)
                                    }
                                >
                                    <For each={selectedCodec()?.encoders}>
                                        {(item, _) => <option>{item}</option>}
                                    </For>
                                </select>
                            </Show>
                            <label for="pixelFormat">Pixel Format</label>
                            <select
                                name="pixelFormat"
                                id="pixelFormat"
                                class="k-dropdown"
                                title="This option is here for the people who knows what they're doing. Not all encoders will support every pixel format."
                                value={pixelFormat()}
                                oninput={(e) => setPixelFormat(e.target.value)}
                            >
                                <option value="">Same as source</option>
                                <For each={pixelFormatList()}>
                                    {(item, _) => (
                                        <option value={item}>{item}</option>
                                    )}
                                </For>
                            </select>
                        </form>
                        <Switch fallback={<div></div>}>
                            <Match
                                when={
                                    selectedCodec()?.shortName === "h264" ||
                                    selectedCodec()?.shortName === "hevc"
                                }
                            >
                                <H264Options
                                    codec={selectedCodec()}
                                    params={ffmpegParams}
                                    onParamChanged={onParametersChanged}
                                />
                            </Match>
                            <Match when={selectedCodec()?.shortName === "av1"}>
                                <AV1Options
                                    codec={selectedCodec()}
                                    encoder={selectedEncoder()}
                                    params={ffmpegParams}
                                    onParamChanged={onParametersChanged}
                                />
                            </Match>
                            <Match
                                when={selectedCodec()?.shortName === "dnxhd"}
                            >
                                <DNxHDOptions
                                    codec={selectedCodec()}
                                    params={ffmpegParams}
                                    onParamChanged={onParametersChanged}
                                />
                            </Match>
                        </Switch>
                        <div class="row flex-col align-items-center">
                            <h3 class="k-form-section-title">Audio</h3>
                        </div>
                        <form class="k-form">
                            <label for="audioCodec">Codec</label>
                            <select
                                class="k-dropdown"
                                id="audioCodec"
                                value={audioCodec()}
                                oninput={(e) => setAudioCodec(e.target.value)}
                            >
                                <option value="copy">Copy from source</option>
                                <For each={audioCodecList()}>
                                    {(item, _) => (
                                        <option value={item.shortName}>
                                            {item.description}
                                        </option>
                                    )}
                                </For>
                            </select>
                            <Show when={getAudioEncoders()}>
                                <label for="audioEncoder">Encoder</label>
                                <select
                                    class="k-dropdown"
                                    id="audioEncoder"
                                    value={audioEncoder()}
                                    oninput={(e) =>
                                        setAudioEncoder(e.target.value)
                                    }
                                >
                                    <For each={getAudioEncoders()}>
                                        {(item, _) => (
                                            <option value={item}>{item}</option>
                                        )}
                                    </For>
                                </select>
                            </Show>
                        </form>
                        <div class="row flex-col align-items-center">
                            <h3 class="k-form-section-title">
                                Extra Arguments
                            </h3>
                        </div>
                        <form
                            class="k-form"
                            onsubmit={(e) => e.preventDefault()}
                        >
                            <label for="globalopts">Global Options</label>
                            <input
                                type="text"
                                name="globalopts"
                                id="globalopts"
                                value={globalopts()}
                                oninput={(e) => {
                                    ffmpegParams.useropts.global =
                                        e.target.value;
                                    setGlobalopts(e.target.value);
                                }}
                            />
                            <label for="inputopts">Input Options</label>
                            <input
                                type="text"
                                name="inputopts"
                                id="inputopts"
                                value={inputopts()}
                                oninput={(e) => {
                                    ffmpegParams.useropts.input =
                                        e.target.value;
                                    setInputopts(e.target.value);
                                }}
                            />
                            <label for="outputopts">Output Options</label>
                            <input
                                type="text"
                                name="outputopts"
                                id="outputopts"
                                value={outputopts()}
                                oninput={(e) => {
                                    ffmpegParams.useropts.output =
                                        e.target.value;
                                    setOutputopts(e.target.value);
                                }}
                            />
                        </form>
                    </div>
                </div>
                <footer class="k-page-footer row flex-col gap2">
                    <div class="row flex-col">
                        <label for="outputCommand">Command</label>
                        <pre id="outputCommand" class="k-text-field col">
                            {outputCommand()}
                        </pre>
                    </div>
                    <div class="row gap2">
                        <button class="k-button" onclick={convertAllClicked}>
                            Convert All
                        </button>
                        <button
                            class="k-button"
                            onclick={convertSelectedClicked}
                            disabled={selectedClip() === ""}
                        >
                            Convert Selected
                        </button>
                    </div>
                </footer>
            </div>
        </main>
    );
}

export default App;
