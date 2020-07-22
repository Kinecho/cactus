import { BaseModel, Collection } from "@shared/FirestoreBaseModels";
import { CactusElement } from "@shared/models/CactusElement";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { ToneResult } from "@shared/api/ToneAnalyzerTypes";
import { InsightWordsResult, SentimentResult } from "@shared/api/InsightLanguageTypes";
import { ResponseMedium } from "@shared/util/ReflectionResponseUtil";
import { PromptType } from "@shared/models/ReflectionPrompt";
import { isNull } from "@shared/util/ObjectUtil";

export enum ResponseMediumType {
    PROMPT = "PROMPT",
    JOURNAL = "JOURNAL",
    EMAIL = "EMAIL"
}


export interface ReflectionContent {
    text?: string;
}

export enum ReflectionResponseField {
    userId = "userId",
    cactusMemberId = "cactusMemberId",
    emailReplyId = "emailReplyId",
    responseMedium = "responseMedium",
    mailchimpMemberId = "mailchimpMemberId",
    mailchimpUniqueEmailId = "mailchimpUniqueEmailId",
    memberEmail = "memberEmail",
    memberFirstName = "memberFirstName",
    memberLastName = "memberLastName",
    content = "content",
    promptId = "promptId",
    promptQuestion = "promptQuestion",
    reflectionDurationMs = "reflectionDurationMs",
    shared = "shared",
    cactusElement = "cactusElement",
    insights = "insights",
    updatedAt = "updatedAt",
    toneAnalysis = "toneAnalysis",
    sentiment = "sentiment",
    mightNeedInsightsUpdate = "mightNeedInsightsUpdate",
    insightsUpdatedAt = "insightsUpdatedAt",
}

export type DynamicResponseValues = Record<string, string | null | undefined>;

export default class ReflectionResponse extends BaseModel {
    readonly collection = Collection.reflectionResponses;
    static Field = ReflectionResponseField;
    userId?: string;
    cactusMemberId?: string;
    anonymous: boolean = false;
    responseDate?: Date;
    emailReplyId?: string;
    responseMedium?: ResponseMedium;
    mailchimpMemberId?: string;
    mailchimpUniqueEmailId?: string;
    memberEmail?: string;
    memberFirstName?: string;
    memberLastName?: string;
    content: ReflectionContent = {};
    promptId?: string;
    promptQuestion?: string;
    reflectionDurationMs?: number = 0;
    shared: boolean = false;
    sharedAt?: Date;
    unsharedAt?: Date;
    cactusElement?: CactusElement | null;
    reflectionDates: Date[] = [];

    coreValue?: CoreValue | undefined | null;

    /**
     * Map of tokens strings, like "{{VALUE}}" to actual values on {DynamicContent} on {{PromptContent}}
     *
     * See {{DynamicContent}}
     */
    dynamicValues?: DynamicResponseValues;

    insights?: InsightWordsResult;
    toneAnalysis?: ToneResult;
    sentiment?: SentimentResult|null;

    mightNeedInsightsUpdate?: boolean = false;
    insightsUpdatedAt?: Date;

    promptType?: PromptType|null;

    get hasAllInsights(): boolean {
        return !isNull(this.sentiment) && !isNull(this.toneAnalysis) && !isNull(this.insights?.insightWords)
    }

    /**
     * Only Add a date log if the new date is not within 10 minutes of an existing date
     * @param {Date} date
     * @param {number=10} thresholdInMinutes - the threshold to look at for deciding if they recently have an entry
     * @returns {boolean} Returns `true` if the date was added to the array, `false` if it was skipped
     */
    addReflectionLog(date: Date, thresholdInMinutes: number = 10): boolean {
        const time = date.getTime();
        const recentDate = this.reflectionDates.find(d => {
            return Math.abs(d.getTime() - time) < thresholdInMinutes * 1000 * 60
        });

        if (recentDate) {
            return false
        }

        this.reflectionDates.push(date);
        return true
    }

    decodeJSON(json: any) {
        super.decodeJSON(json);

        this.sharedAt = json.sharedAt ? new Date(json.sharedAt) : undefined;
        this.unsharedAt = json.unsharedAt ? new Date(json.unsharedAt) : undefined;
        const dateArray = (json.reflectionDates || []) as number[];
        this.reflectionDates = dateArray.map((timestamp: number) => {
            return new Date(timestamp)
        })
    }
}