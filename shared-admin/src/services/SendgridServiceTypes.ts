export interface MagicLinkEmail {
    email: string,
    link: string,
    displayName?:string,
}

export interface InvitationEmail {
    toEmail: string,
    fromEmail: string,
    fromName: string | undefined,
    link: string,
    message?: string,
}

export interface FriendRequestEmail {
    toEmail: string,
    fromEmail: string,
    fromName: string | undefined,
    link: string
}

export interface TrialEndingEmail {
    toEmail: string,
    link: string,
    firstName: string | undefined
}