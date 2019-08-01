import {ApiResponse} from "@shared/api/ApiTypes";

export interface EmailStatusRequest {
    email: string,
}

export interface EmailStatusResponse extends ApiResponse {
    exists: boolean,
    email: string,
    error?: any,
    message?:string,
}

export interface MagicLinkRequest {
    email: string,
    continuePath: string,
}

export interface MagicLinkResponse extends ApiResponse{
    exists: boolean,
    sendSuccess: boolean,
    email: string,
    error?:any,
    message?: string,
}