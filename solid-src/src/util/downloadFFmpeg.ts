async function darwinFFmpeg() {}

export async function downloadFFmpeg() {
    console.log("Downloading FFmpeg...");

    if (window.NL_OS === "Darwin") {
        await darwinFFmpeg();
        return;
    }

    // let req = await fetch("https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest", {
    //     headers: {
    //         "Accept": "application/vnd.github+json",
    //         "X-GitHub-Api-Version": "2022-11-28"
    //     }
    // });
}
