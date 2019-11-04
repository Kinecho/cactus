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