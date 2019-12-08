import {ListMember, ListMemberStatus} from "@shared/mailchimp/models/MailchimpTypes";
import {ApiResponse} from "@shared/api/ApiTypes";

export interface UpdateStatusRequest {
    status: ListMemberStatus,
    email: string,
}

export interface UpdateStatusResponse extends ApiResponse {
    success: boolean,
    listMember?:ListMember
    error?: any,
}

export interface UnsubscribeRequest {
    email: string,
    mcuid: string,
}

export interface UnsubscribeResponse {
    success: boolean,
    error?: string,
}