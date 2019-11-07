export interface MagicLinkEmail {
    email: string,
    link: string,
    displayName?:string,
}

export interface InvitationEmail {
    toEmail: string,
    fromEmail: string,
    link: string,
    message?: string,
}