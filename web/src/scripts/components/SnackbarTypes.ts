export const SnackbarColors: (SnackbarColor|string)[] = ['success', 'successAlt', 'warning', 'danger', "info", "default"];

export type SnackbarColor = 'success' | 'successAlt' | 'warning' | 'danger' | "info" | "default";

export interface SnackbarMessage {
    id?: string,
    message: string,
    timeoutMs?: number,
    closeable?: boolean,
    autoHide?: boolean,
    color?: SnackbarColor
}

export type SnackbarMessageType =
    | string
    | SnackbarMessage
