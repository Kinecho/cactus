export interface EmailDataParams {
    email?: string,
    sendEmail: boolean,
}

export interface EmailDataResult {
    success: boolean,
    message?: string,
    dataExportId?: string,
    downloadUrl?: string,
}

export interface CreateDataExportResult {
    success: boolean,
    downloadUrl?: string,
}