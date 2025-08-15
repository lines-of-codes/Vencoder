import { os } from "@neutralinojs/lib";

const openFilePrograms: { [os: string]: string } = {
    Linux: "xdg-open",
    Windows: "explorer",
    Darwin: "open",
};

export function openFile(path: string) {
    let program = openFilePrograms[window.NL_OS] ?? "";

    return os.execCommand(`${program} ${path}`);
}
