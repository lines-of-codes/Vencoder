import { openFile } from "@/util/oshelper";
import { getTemporaryFilePath, getVencoderFolder } from "@/util/path";
import { durationString, generateRandomString } from "@/util/string";
import {
    events,
    os,
    storage,
    filesystem,
    type SpawnedProcess,
} from "@neutralinojs/lib";
import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { Temporal } from "temporal-polyfill";

interface TargetFile {
    com: string;
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
    const [queueLength, setQueueLength] = createSignal(0);
    const [finished, setFinished] = createSignal(false);
    const progressObject: {
        [key: string]: ProgressInfo;
    } = {};
    const [progressList, setProgressList] = createSignal<ProgressInfo[]>([]);
    const [isCancelling, setIsCancelling] = createSignal(false);
    const [timeUsed, setTimeUsed] = createSignal<Temporal.Duration>();
    const filesBeingProcessed: Record<number, TargetFile> = {};
    const logs: { [id: number]: string[] } = {};
    let fileQueue: TargetFile[] = [];
    let successfulCount = 0;
    let unsuccessfulCount = 0;
    let totalCount = 0;
    let startTime = Temporal.Now.instant();

    function windowIsFocused() {
        setWindowFocused(false);
    }

    function windowUnfocused() {
        setWindowFocused(true);
    }

    async function processFiles(files: TargetFile[]) {
        const processes = [];

        for (const file of files) {
            const proc = await os.spawnProcess(file.com);

            logs[proc.id] = [];
            processes.push(proc);

            progressObject[proc.id] = {
                filename: file.in,
                percentage: 0,
            };

            filesBeingProcessed[proc.id] = file;
        }

        setRunningProcesses(processes);
    }

    function handleSpawnedProcessEvents(evt: CustomEvent) {
        switch (evt.detail.action) {
            case "stdOut":
                const info: FFmpegProgressInfo = Object.fromEntries(
                    (evt.detail.data as string)
                        .split("\n")
                        .map((v) => v.split("=")),
                );
                const file = filesBeingProcessed[evt.detail.id];

                if (file === undefined) return;

                progressObject[evt.detail.id].percentage =
                    (parseInt(info.out_time_us) / file.len) * 100;

                if (Number.isNaN(progressObject[evt.detail.id].percentage)) {
                    progressObject[evt.detail.id].percentage = 0;
                }

                setProgressList(Object.values(progressObject));
                break;
            case "stdErr":
                logs[evt.detail.id].push(evt.detail.data);
                break;
            case "exit":
                console.log(`FFmpeg exited with code: ${evt.detail.data}`);

                if (evt.detail.data === 0) {
                    progressObject[evt.detail.id].percentage = 100;
                    setProgressList(Object.values(progressObject));
                    successfulCount += 1;
                } else {
                    unsuccessfulCount += 1;

                    // If the exit code isn't 255 (the exit code of the program exiting because of cancellation)
                    if (evt.detail.data !== 255) {
                        os.showNotification(
                            "File Encoding Failed",
                            `Encoding for file "${filesBeingProcessed[evt.detail.id].in}" failed. Exit code ${evt.detail.data}.`,
                        );

                        const tempFilename = `${getTemporaryFilePath()}/vencoder-ffmpeg-${generateRandomString(8)}.log`;
                        filesystem.writeFile(
                            tempFilename,
                            logs[evt.detail.id].join("\n"),
                        );
                        openFile(tempFilename);
                    }
                }

                if (successfulCount + unsuccessfulCount === totalCount) {
                    setTimeUsed(Temporal.Now.instant().since(startTime));
                    os.showNotification(
                        "File(s) encoded.",
                        `${successfulCount} files encoded successfully. ${unsuccessfulCount} failed or cancelled.`,
                    );
                    successfulCount = 0;
                    unsuccessfulCount = 0;
                    totalCount = 0;
                }

                if (finished()) return;

                const nextFile = fileQueue.pop();

                if (nextFile === undefined) {
                    setFinished(true);
                    return;
                }

                processFiles([nextFile]);
                setQueueLength(fileQueue.length);
                break;
        }
    }

    onMount(async () => {
        events.on("windowFocus", windowIsFocused);
        events.on("windowBlur", windowUnfocused);
        events.on("spawnedProcess", handleSpawnedProcessEvents);

        const storedFileInfo: TargetFile[] = JSON.parse(
            await storage.getData("filesBeingProcessed"),
        );
        totalCount = storedFileInfo.length;

        const file = storedFileInfo.pop()!;

        processFiles([file]);
        fileQueue = storedFileInfo;
        setQueueLength(fileQueue.length);

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
                    {progressList().map((item) => {
                        return (
                            <div
                                class="row flex-col"
                                style={{
                                    "padding-bottom": "var(--k-grid-unit)",
                                }}
                            >
                                <label>{item.filename}</label>
                                <div
                                    class="grid"
                                    style={{
                                        "grid-template-columns": "90% 10%",
                                    }}
                                >
                                    <div class="row justify-content-center align-items-center">
                                        <progress
                                            class="col"
                                            value={item.percentage}
                                            max="100"
                                        />
                                    </div>
                                    <div class="row justify-content-center align-items-center">
                                        {Math.min(
                                            Math.round(item.percentage),
                                            100,
                                        )}
                                        %
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div>{queueLength()} file(s) queued.</div>
                    <Show when={timeUsed() !== undefined}>
                        <div>Consumed {durationString(timeUsed()!)}</div>
                    </Show>
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
