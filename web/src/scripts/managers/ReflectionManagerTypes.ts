import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import ReflectionResponse from "@shared/models/ReflectionResponse";

export interface CreateFreeformParams {
    title: string,
    note: string,
    member: CactusMember,
    duration: number,
}

export interface CreateFreeformResult {
    success: boolean,
    error?: string|null,
    prompt?: ReflectionPrompt,
    reflectionResponse?: ReflectionResponse,
}