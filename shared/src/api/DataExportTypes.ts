export interface EmailDataParams {
    email: string,
}

export interface EmailDataResult {
    success: boolean,
    message?: string,
    dataExportId?: string,
    downloadUrl?: string,
}