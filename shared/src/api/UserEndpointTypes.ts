import {ApiResponse} from "@shared/api/ApiTypes";

export interface DeleteUserRequest {
    email: string,
}

export interface FeatureAuthRequest {
    memberId: string
}

export interface DeleteUserResponse extends ApiResponse {
    success: boolean,
    error?: any,
    message?: string,
}