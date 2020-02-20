import {Endpoint, getAuthHeaders, request} from "@web/requestUtils";
import {getAuth} from "@web/firebase";
import {AxiosError} from "axios";
import Logger from "@shared/Logger";
import {getAppType} from "@web/DeviceUtil";
import {
    DeleteUserResponse,
    DeleteUserRequest
} from "@shared/api/UserEndpointTypes";

const logger = new Logger("social.ts");

export async function deleteCurrentUserPermanently(email: string): Promise<DeleteUserResponse> {
    const currentUser = getAuth().currentUser;

    if (!currentUser?.email) {
        return {
            success: false,
            error: "Current user is not logged in.",
            message: "Current user is not logged in."
        }
    } else if (currentUser?.email === email) {
        logger.log("current user", currentUser);
        const requestOptions: DeleteUserRequest = {
            email
        };

        try {
            const headers = await getAuthHeaders();
            const apiResponse = await request.post(Endpoint.userDeletePermanently, requestOptions, {headers});
            return apiResponse.data;
        } catch (e) {
            logger.error("API call to delete user failed", e.response?.data ? e.response.data : e);
            return {
                success: false,
                message: "Failed to send invitation",
                error: e
            }
        }
    } else {
        return {
            success: false,
            message: "Could not delete - invalid user / email"
        }
    }
}