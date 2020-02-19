import {ApiResponse} from "@shared/api/ApiTypes";
import {AppType} from "@shared/models/ReflectionResponse";

export interface DeleteUserRequest {
    email: string,
}

export interface DeleteUserResponse extends ApiResponse {
    success: boolean,
    error?: any,
    message?: string,
}