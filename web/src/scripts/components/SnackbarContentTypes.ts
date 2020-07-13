import { isString } from "@shared/util/ObjectUtil";

export const DEFAULT_DURATION_MS = 5000;
export type SnackbarColor = 'success' | 'successAlt' | 'dolphin' | 'warning' | 'danger' | "info" | "default";

export type SnackbarMessageData = { message: string, timeoutMs?: number, closeable?: boolean, autoHide?: boolean, color?: SnackbarColor, id?: string }

export type SnackbarMessage =
| string
| SnackbarMessageData


export function isSnackbarMessageData(message: SnackbarMessage): message is SnackbarMessageData {
    if (isString(message)) {
        return false
    }
    return true;
}
