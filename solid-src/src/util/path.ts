import Neutralino from "@neutralinojs/lib";

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

export async function getVencoderFolder() {
    switch (window.NL_OS) {
        case "Linux":
            return `${await Neutralino.os.getEnv("HOME")}/Vencoder/`;
        case "Windows":
            return `${await Neutralino.os.getEnv("HOMEPATH")}\\Vencoder\\`;
    }
}
