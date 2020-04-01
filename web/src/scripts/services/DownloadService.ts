import { request as api, getAuthHeaders, Endpoint, isAxiosError, getUserToken } from "@web/requestUtils";
import Logger from "@shared/Logger";
import { Config } from "@web/config";
import { appendQueryParams } from "@shared/util/StringUtil";
import { QueryParam } from "@shared/util/queryParams";
import { EmailDataParams, EmailDataResult } from "@shared/api/DataExportTypes";

export default class DownloadService {
    static shared = new DownloadService();

    logger = new Logger("DownloadService");

    async getDownloadDataUrl(): Promise<string|undefined> {
        const token = await getUserToken();
        if (token) {
            let url = `${Config.apiDomain}/${Endpoint.downloadUserData}`;

            url = appendQueryParams(url, {[QueryParam.AUTH_TOKEN]: token});
            return url;
        }
        return;
    }

    async emailData(params: EmailDataParams): Promise<EmailDataResult> {
        const authHeaders = await getAuthHeaders();
        try {
            const response = await api.post(Endpoint.emailUserData, params, { headers: { ...authHeaders } });
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

    // /**
    //  * Initiates a download of the user's data. Returns the URL that the download points to.
    //  * @return {Promise<string>}
    //  */
    // async downloadUserData(): Promise<void> {
    //     // const headers = await getAuthHeaders();
    //     try {
    //         const url = this.getDownloadDataUrl();
    //         if (url) {
    //             window.location.href = url;
    //         }
    //     } catch (error) {
    //         if (isAxiosError(error)) {
    //             this.logger.error("Failed to download user data", error.response?.data)
    //         } else {
    //             this.logger.error("failed to download data", error);
    //         }
    //     }
    //
    // }
}