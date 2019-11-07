import {EmailContact} from "@shared/types/EmailContactTypes";

export interface InviteResult {
    email: string,
    message: string,
    data?: {
      success: boolean
    },
    error?: {
        title: string,
        message: string,
        friendlyMessage?: string
    }
}

export interface SocialInviteRequest {
    toContact: EmailContact,
    message?: string
}