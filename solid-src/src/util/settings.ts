import { events, storage } from "@neutralinojs/lib";

export interface UserSettings {
    ffplay: boolean;
    ffpath: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
    ffplay: false,
    ffpath: null,
};
const USER_SETTINGS_KEY = "userSettings";
export const SETTINGS_CHANGED = "settingsChanged";

export async function loadSettings(): Promise<UserSettings> {
    try {
        const settings = await storage.getData(USER_SETTINGS_KEY);
        return JSON.parse(settings);
    } catch (e) {
        console.error(e);
    }
    return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
    await storage.setData(USER_SETTINGS_KEY, JSON.stringify(settings));
    await events.broadcast(SETTINGS_CHANGED, settings);
}
