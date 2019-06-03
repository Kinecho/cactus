export const MailchimpMemberId = "X-MC-User";

export enum Header {
    RECEIVED_SPF = "Received-SPF",
    AUTHENTICATION_RESULTS = "Authentication-Results",
}

export default interface EmailHeaders {[key: string]: string|null|undefined}