import "firebase/functions"
import { Endpoint, getAuthHeaders, request } from "@web/requestUtils";
import { NotificationStatus } from "@shared/models/CactusMember";
import {
    UnsubscribeRequest,
    UnsubscribeResponse,
    UpdateStatusRequest,
    UpdateStatusResponse
} from "@shared/mailchimp/models/UpdateStatusTypes";
import { ListMemberStatus } from "@shared/mailchimp/models/MailchimpTypes";
import Logger from "@shared/Logger";

const logger = new Logger("mailchimp.ts");

export async function confirmUnsubscribe(options: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    return (await request.post(Endpoint.unsubscribeConfirm, options)).data as UnsubscribeResponse;
}

export async function updateSubscriptionStatus(status: NotificationStatus, email: string): Promise<UpdateStatusResponse> {

    const updateRequest: UpdateStatusRequest = {status: ListMemberStatus.subscribed, email: email};
    switch (status) {
        case NotificationStatus.NOT_SET:
            //nothing to do here
            return {success: true};
        case NotificationStatus.ACTIVE:
            updateRequest.status = ListMemberStatus.subscribed;
            break;
        case NotificationStatus.INACTIVE:
            updateRequest.status = ListMemberStatus.unsubscribed;
            break;
    }

    const headers = await getAuthHeaders();
    try {
        const response = await request.put(Endpoint.updateSubscriberStatus, updateRequest, {headers: {...headers}});

        return response.data;
    } catch (error) {
        logger.error("Unable to update the user's status");
        //TODO: Show snackbar error;
        return {error: error, success: false};
    }
}