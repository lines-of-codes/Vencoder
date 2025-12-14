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
import { getVencoderFolder } from "./util/path";
import "./css/icons.css";
import BreezeIcon from "./components/BreezeIcon";
import AV1Options from "./components/AV1Options";
import DNxHDOptions from "./components/DNxHDOptions";
import HelpButton from "./components/HelpButton";

const commonCodecs = new Set(["h264", "hevc", "vp9", "av1", "dnxhd"]);

interface FileQueueItem {
    command: string;
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
    const [customFileExt, setCustomFileExt] = createSignal("");
    const [globalopts, setGlobalopts] = createSignal("");
    const [inputopts, setInputopts] = createSignal("");
    const [outputopts, setOutputopts] = createSignal("");
    const [audioCodec, setAudioCodec] = createSignal("copy");
    const [audioEncoder, setAudioEncoder] = createSignal("");
    const [pixelFormatList, setPixelFormatList] = createSignal([] as string[]);
    const [pixelFormat, setPixelFormat] = createSignal("");
    const [fastStart, setFastStart] = createSignal(false);
    let supportedCodecs: CodecList = { vcodecs: [], acodecs: [] };
    let ffmpegParams: FFmpegParams = {
        vcodec: "",
        useropts: {
            global: "",
            input: "",
            output: "",
        },
        extraopts: {},
    };

    function windowIsFocused() {
        setWindowFocused(true);
    }

    function windowUnfocused() {
        setWindowFocused(false);
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);

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

        let encoder = newValue;
        if (codecObj?.encoders.length !== 0) {
            encoder = codecObj?.encoders[0] ?? "";
        }
        setSelectedCodec(codecObj);
        setSelectedEncoder(encoder);
    }

    createEffect(() => {
        ffmpegParams = {
            vcodec: selectedCodec()?.shortName ?? "",
            encoder: selectedEncoder(),
            useropts: {
                global: "",
                input: "",
                output: "",
            },
            extraopts: {},
        };
    });

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

    function onParametersChanged<K extends keyof FFmpegParams>(
        key: K,
        value: any,
    ) {
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
            processArgs: "--port=5434",
        });
    }

    createEffect(() => {
        let encoder: string | undefined = selectedEncoder();

        if (encoder === "") {
            encoder = undefined;
        }

        let acodec = audioEncoder();

        if (acodec === undefined || acodec === "") {
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
            faststart: fastStart(),
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
            extraopts: ffmpegParams.extraopts,
            customExt: customFileExt(),
        };

        setOutputCommand(generateOutputCommand(ffmpegParams));
    });

    async function convertClip(
        clip: string,
    ): Promise<FileQueueItem | undefined> {
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
            command: generateOutputCommand(ffmpegParams),
            file: clip,
            length,
        };
    }

    async function convertAllClicked() {
        const list = fileList();

        const queue: FileQueueItem[] = [];

        for (const file of list) {
            const info = await convertClip(file);

            if (info !== undefined) {
                queue.push(info);
            }
        }

        await Neutralino.storage.setData(
            "filesBeingProcessed",
            JSON.stringify(
                queue.map((v) => ({
                    com: v.command,
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
            processArgs: "--port=5433",
        });
    }

    async function convertSelectedClicked() {
        const result = await convertClip(selectedClip());

        if (result === undefined) {
            return;
        }

        console.log(result);

        await Neutralino.storage.setData(
            "filesBeingProcessed",
            JSON.stringify([
                {
                    com: result.command,
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
            processArgs: "--port=5433",
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
                            <Show
                                when={
                                    customFileExt() === "mp4" ||
                                    (customFileExt() === "" &&
                                        videoFileExtensions[
                                            selectedCodec()?.shortName ?? ""
                                        ] === "mp4")
                                }
                            >
                                <div></div>
                                <div class="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={fastStart()}
                                        onInput={(e) => {
                                            setFastStart(e.target.checked);
                                        }}
                                        id="fastStartCheck"
                                    />
                                    <label for="fastStartCheck">
                                        Enable Fast Start
                                    </label>
                                    <HelpButton
                                        title="This will move some information to the beginning of your file and allow the video to begin playing before it is completely downloaded by the viewer, recommended for web videos. Click for more information."
                                        url="https://trac.ffmpeg.org/wiki/Encode/H.264#faststartforwebvideo"
                                    />
                                </div>
                            </Show>
                        </form>
                        <div class="row flex-col align-items-center">
                            <h3 class="k-form-section-title">
                                Encoder Options
                            </h3>
                        </div>
                        <Switch
                            fallback={
                                <div class="text-center mt-4">No options.</div>
                            }
                        >
                            <Match
                                when={
                                    selectedCodec()?.shortName === "h264" ||
                                    selectedCodec()?.shortName === "hevc"
                                }
                            >
                                <H264Options
                                    codec={selectedCodec()}
                                    encoder={selectedEncoder()}
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
