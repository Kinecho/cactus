import { Endpoint, getAuthHeaders, isAxiosError, request as api } from "@web/requestUtils";
import Logger from "@shared/Logger";
import { EmailDataParams, EmailDataResult } from "@shared/api/DataExportTypes";

export default class DownloadService {
    static shared = new DownloadService();

    logger = new Logger("DownloadService");

    /**
     * Call the backend to create a new Data Export record. It returns the URL in which the user can download the file.
     * Optionally, you can choose to send the download link to the user.
     * @param {EmailDataParams} params
     * @return {Promise<EmailDataResult>}
     */
    async exportData(params: EmailDataParams): Promise<EmailDataResult> {
        const authHeaders = await getAuthHeaders();
        try {
            const response = await api.post(Endpoint.exportData, params, { headers: { ...authHeaders } });
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                this.logger.error("Failed to download user data", error.response?.data);
                return error.response?.data ?? {
                    success: false,
                    message: "An unexpected error occurred. Please try again later."
                };
            } else {
                this.logger.error("failed to download data", error);
                return { success: false, message: "An unexpected error occurred. Please try again later." };
            }
        }
    }
}