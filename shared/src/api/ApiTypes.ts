export interface ApiResponse {
    success?: boolean,
    error?: any,
}

export interface ApiResponseError {
    message?: string,
    error?: Error | any,
}