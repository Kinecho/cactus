export interface MagicLinkEmail {
    email: string,
    link: string,
    displayName?:string,
}

export interface InvitationEmail {
    to_email: string,
    link: string,
}