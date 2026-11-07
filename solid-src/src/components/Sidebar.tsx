import { playFile } from "@/util/ffmpeg";
import BreezeIcon from "./BreezeIcon";
import { For, type Accessor } from "solid-js";
import type { UserSettings } from "@/util/settings";
import Neutralino from "@neutralinojs/lib";

function Sidebar({
    fileList,
    setFileList,
    selectedClip,
    setSelectedClip,
    settings,
    settingsDialog,
}: {
    fileList: Accessor<string[]>;
    setFileList: (files: string[]) => void;
    selectedClip: Accessor<string>;
    setSelectedClip: (clip: string) => void;
    settings: Accessor<UserSettings>;
    settingsDialog: HTMLDialogElement;
}) {
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

    function removeBtnClicked() {
        if (selectedClip() === "") return;

        const list = fileList();
        const targetClip = selectedClip();
        setFileList(list.filter((v: string) => v !== targetClip));
        setSelectedClip("");
    }

    function removeAllBtnClicked() {
        setFileList([]);
        setSelectedClip("");
    }

    function playBtnClicked() {
        playFile(selectedClip(), settings());
    }

    function settingsBtnPressed() {
        settingsDialog.showModal();
    }

    return (
        <div
            class="row flex-col gap2 k-white-sidebar k-rborder h-full"
            style={{ padding: "8px" }}
        >
            <ul class="k-list-view bordered col">
                <For each={fileList()}>
                    {(item: string, _: any) => (
                        <li
                            class={item == selectedClip() ? "selected" : ""}
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
    );
}

export default Sidebar;
