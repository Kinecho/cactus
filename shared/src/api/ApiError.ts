import {ApiResponseError} from "@shared/api/ApiTypes";

export default class ApiError implements ApiResponseError {
    friendlyMessage?: string;
    error?: Error;
    code?: Number;
    message?: string;
}