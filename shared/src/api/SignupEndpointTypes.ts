import {ApiResponse} from "@shared/api/ApiTypes";
import {AppType} from "@shared/models/ReflectionResponse";

export interface ChangeEmailRequest {
    newEmail: string,
}

export enum ChangeEmailResponseCode {
    INVALID_EMAIL = "INVALID_EMAIL",
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    CREDENTIAL_TOO_OLD = "CREDENTIAL_TOO_OLD",
    UNKNKOWN_ERROR = "UNKNOWN_ERROR",
    EMAIL_IN_USE = "EMAIL_IN_USE",
}

export interface ChangeEmailResponse {
    emailAvailable: boolean,
    newEmail: string,
    confirmationEmailSent: boolean,
    code: ChangeEmailResponseCode,
    error?: Error
}

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
    queryParams?: { [id: string]: string },
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
    signupQueryParams?: { [name: string]: string } | undefined;
    reflectionResponseIds?: string[],
    app?: AppType,
}