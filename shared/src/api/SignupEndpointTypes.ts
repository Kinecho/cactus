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