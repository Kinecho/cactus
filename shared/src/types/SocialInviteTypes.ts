import {EmailContact} from "@shared/types/EmailContactTypes";
import {ApiResponse} from "@shared/api/ApiTypes";
import {AppType} from "@shared/models/ReflectionResponse";

export type SocialInvitePayload = SocialInviteRequest | SocialInviteRequestBatch;

export interface SocialInviteRequest {
    app: AppType
    toContact: EmailContact,
    message?: string
}

export interface SocialInviteRequestBatch {
    app: AppType
    toContacts: EmailContact[],
    message?: string
}

export function isSocialInviteRequestBatch(invite: SocialInvitePayload): invite is SocialInviteRequestBatch {
    return (invite as SocialInviteRequestBatch).toContacts !== undefined;
}

export function isSocialInviteRequestSingle(invite: SocialInvitePayload): invite is SocialInviteRequest {
    return (invite as SocialInviteRequest).toContact !== undefined;
}

export interface InvitationSendResult {
    toEmail: string,
    success: boolean,
    sentSuccess: boolean,
    error?: any,
    errorMessage?: string,
    socialInviteId?: string,
}

export interface InvitationResponse extends ApiResponse {
    success: boolean,
    toEmails: string[],
    fromEmail?: string | undefined,
    results?: {
        [email: string]: InvitationSendResult
    }
    message?: string,
    error?: any,
}