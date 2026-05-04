import { filesystem, os } from "@neutralinojs/lib";

async function darwinFFmpeg() {}

/**
 * Downloads FFmpeg
 */
export async function downloadFFmpeg() {
    console.log("Downloading FFmpeg...");

    if (window.NL_OS === "Darwin") {
        return await darwinFFmpeg();
    }

    let req = await fetch(
        "https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest",
        {
            headers: {
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        },
    );

    if (!req.ok) {
        throw Error("An error occurred while listing FFmpeg versions");
    }

    const assetName = `ffmpeg-master-latest-${
        window.NL_OS === "Windows" ? "win" : "linux"
    }${window.NL_ARCH === "arm" ? "arm" : ""}64-gpl.${
        window.NL_OS === "Windows" ? "zip" : "tar.xz"
    }`;
    const assets = (await req.json()).assets as Record<string, any>[];
    const asset = assets.find((v) => v.name === assetName);

    if (!asset) throw Error("Asset not found");

    const data = await (
        await (await fetch(asset["browser_download_url"])).blob()
    ).arrayBuffer();
    await filesystem.writeBinaryFile(
        await filesystem.getJoinedPath(
            await os.getPath("data"),
            window.NL_APPID,
            assetName,
        ),
        data,
    );
}
