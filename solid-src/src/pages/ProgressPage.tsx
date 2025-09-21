import { getVencoderFolder } from "@/util/path";
import { events, os, storage, type SpawnedProcess } from "@neutralinojs/lib";
import { createSignal, onMount, onCleanup, Show, Index } from "solid-js";

interface TargetFile {
    id: string;
    in: string;
    len: number;
}

interface ProgressInfo {
    filename: string;
    percentage: number;
}

interface FFmpegProgressInfo {
    bitrate: string;
    drop_frames: string;
    dup_frames: string;
    fps: string;
    frame: string;
    out_time: string;
    out_time_ms: string;
    out_time_us: string;
    progress: string;
    speed: string;
    total_size: string;
}

function ProgressPage() {
    const [windowFocused, setWindowFocused] = createSignal(true);
    const [runningProcesses, setRunningProcesses] = createSignal<
        SpawnedProcess[]
    >([]);
    const [finished, setFinished] = createSignal(false);
    const [fileInfo, setFileInfo] = createSignal<TargetFile[]>([]);
    const progressObject: {
        [key: string]: ProgressInfo;
    } = {};
    const [progressList, setProgressList] = createSignal<ProgressInfo[]>([]);
    const [isCancelling, setIsCancelling] = createSignal(false);

    function windowIsFocused() {
        setWindowFocused(false);
    }

    function windowUnfocused() {
        setWindowFocused(true);
    }

    function handleSpawnedProcessEvents(evt: CustomEvent) {
        switch (evt.detail.action) {
            case "stdOut":
                const info: FFmpegProgressInfo = Object.fromEntries(
                    (evt.detail.data as string)
                        .split("\n")
                        .map((v) => v.split("=")),
                );
                const file = fileInfo().find((v) => v.id === evt.detail.id);

                if (file === undefined) return;

                progressObject[evt.detail.id] = {
                    filename: file.in,
                    percentage: (parseInt(info.out_time_us) / file.len) * 100,
                };

                if (Number.isNaN(progressObject[evt.detail.id].percentage)) {
                    progressObject[evt.detail.id].percentage = 0;
                }

                setProgressList(Object.values(progressObject));
                break;
            case "stdErr":
                break;
            case "exit":
                console.log(`FFmpeg exited with code: ${evt.detail.data}`);

                os.getSpawnedProcesses().then((processes) => {
                    if (processes.length === 0) {
                        setFinished(true);
                    }

                    setRunningProcesses(processes);
                });
                break;
        }
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);
        events.on("spawnedProcess", handleSpawnedProcessEvents);

        const processes = await os.getSpawnedProcesses();
        setRunningProcesses(processes);

        const storedFileInfo: TargetFile[] = JSON.parse(
            await storage.getData("filesBeingProcessed"),
        );
        setFileInfo(storedFileInfo);

        for (let i = 0; i < processes.length; i++) {
            progressObject[processes[i].id] = {
                filename: storedFileInfo[i].in,
                percentage: 0,
            };
        }

        setProgressList(Object.values(progressObject));
    });

    onCleanup(() => {
        events.off("windowFocus", windowIsFocused);
        events.off("windowBlur", windowUnfocused);
        events.off("spawnedProcess", handleSpawnedProcessEvents);
    });

    async function cancelBtnClicked() {
        setIsCancelling(true);

        const processes = runningProcesses();

        for (const process of processes) {
            try {
                await os.updateSpawnedProcess(process.id, "exit");
            } catch (e) {
                console.error(e);
            }
        }

        setFinished(true);
    }

    async function openFolder() {
        const folder = await getVencoderFolder();

        if (folder) {
            os.open(folder);
        }
    }

    return (
        <main class="row flex-col">
            <div class="container row flex-col" style={{ flex: "1" }}>
                <header
                    class={`k-page-header ${windowFocused() ? "" : "window-blur"}`}
                >
                    <div class="page-title" role="heading">
                        Progress
                    </div>
                </header>
                <div
                    class="p-grid col row flex-col"
                    style={{ overflow: "scroll" }}
                >
                    <Show when={finished()}>
                        Processes finished. You can close this window.
                    </Show>
                    <Index each={progressList()}>
                        {(item, _) => (
                            <div
                                class="row flex-col"
                                style={{
                                    "padding-bottom": "var(--k-grid-unit)",
                                }}
                            >
                                <label>{item().filename}</label>
                                <div
                                    class="grid"
                                    style={{
                                        "grid-template-columns": "90% 10%",
                                    }}
                                >
                                    <div class="row justify-content-center align-items-center">
                                        <progress
                                            class="col"
                                            value={item().percentage}
                                            max="100"
                                        />
                                    </div>
                                    <div class="row justify-content-center align-items-center">
                                        {Math.min(
                                            Math.round(item().percentage),
                                            100,
                                        )}
                                        %
                                    </div>
                                </div>
                            </div>
                        )}
                    </Index>
                </div>
                <footer class="p-medium row" style={{ "align-items": "end" }}>
                    <Show
                        when={finished()}
                        fallback={
                            <button
                                class="k-button"
                                disabled={isCancelling()}
                                onclick={cancelBtnClicked}
                            >
                                Cancel
                            </button>
                        }
                    >
                        <button class="k-button" onclick={openFolder}>
                            Open Folder
                        </button>
                    </Show>
                </footer>
            </div>
        </main>
    );
}

export default ProgressPage;
