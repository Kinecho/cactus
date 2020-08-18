import {ApiResponse} from "@shared/api/ApiTypes";
import { AppType } from "@shared/types/DeviceTypes";

export interface EmailStatusRequest {
    email: string,
}

export interface EmailStatusResponse extends ApiResponse {
    exists: boolean,
    email: string,
    error?: any,
    message?: string,
}

export enum SourceApp {
    web = "web",
    ios = "ios",
    android = "android"
}

export interface MagicLinkRequest {
    email: string,
    continuePath: string,
    referredBy?: string | undefined,
    reflectionResponseIds?: string[],
    queryParams?: { [id: string]: string|null },
    sourceApp?: SourceApp
}

export interface MagicLinkResponse extends ApiResponse {
    exists: boolean,
    success: boolean,
    email: string,
    error?: any,
    message?: string,
}

export interface LoginEvent {
    userId?: string | null,
    isNewUser: boolean,
    providerId?: string,
    referredByEmail?: string | undefined | null,
    signupQueryParams?: { [name: string]: string|null } | undefined;
    reflectionResponseIds?: string[],
    app?: AppType,
}