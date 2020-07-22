import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import { FreeformFormData } from "@components/freeform/FreeformPromptTypes";
import SentPrompt from "@shared/models/SentPrompt";

export interface CreateFreeformParams extends FreeformFormData{
    title: string,
    note: string,
    member: CactusMember,
    duration: number,
}

export type CreateFreeformResult = {
    success: true,
    prompt: ReflectionPrompt,
    reflectionResponse: ReflectionResponse,
    sentPrompt: SentPrompt
} | { success: false, error: string }

export interface UpdateFreeformParams extends FreeformFormData {
    reflection: ReflectionResponse,
    prompt: ReflectionPrompt,
    member: CactusMember,
    duration: number,
    title: string,
    note: string,
}

export type UpdateFreeformResult = { success: true } | { error: string, success: false }

export interface FreeFormSaveEvent {
    created: boolean,
    prompt: ReflectionPrompt,
    reflectionResponse: ReflectionResponse,
    // sentPrompt: SentPrompt,
}