import {AxiosError} from "axios"

export interface ApiResponse {
    success?: boolean,
    error?: any,
}

export interface ApiResponseError {
    message?: string,
    error?: Error | any,
}


export function isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
}

export function getAxiosError(error: any): any {
    if (isAxiosError(error)) {
        return error.response?.data ?? error;
    }
    return error;
}