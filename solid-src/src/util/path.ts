export function getTemporaryFilePath() {
    switch (window.NL_OS) {
        case "Windows":
            return "%temp%";
        case "Linux":
            return "/tmp";
        default:
            return ".";
    }
}
