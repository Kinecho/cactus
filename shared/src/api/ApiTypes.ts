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