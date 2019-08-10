import {ApiResponse} from "@shared/api/ApiTypes";

export interface EmailStatusRequest {
    email: string,
}

export interface EmailStatusResponse extends ApiResponse {
    exists: boolean,
    email: string,
    error?: any,
    message?: string,
}

export interface MagicLinkRequest {
    email: string,
    continuePath: string,
    referredBy?: string | undefined,
}

export interface MagicLinkResponse extends ApiResponse {
    exists: boolean,
    success: boolean,
    email: string,
    error?: any,
    message?: string,
}

export interface LoginEvent {
    userId: string,
    isNewUser: boolean,
    providerId: string,
    referredByEmail?: string | undefined | null
}