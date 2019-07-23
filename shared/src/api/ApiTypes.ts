export interface ApiResponse {
    error?: any,
}

export interface ApiResponseError {
    message?: string,
    error?: Error | any,
}