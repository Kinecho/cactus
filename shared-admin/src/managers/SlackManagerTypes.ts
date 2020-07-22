import CactusMember from "@shared/models/CactusMember";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import SentPrompt from "@shared/models/SentPrompt";

export interface ReflectionActivityParams {
    member?: CactusMember,
    reflectionResponse?: ReflectionResponse,
    sentPrompt?: SentPrompt|null,
    sentPromptCreated?: boolean;
}