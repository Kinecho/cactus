import { CactusConfig } from "@admin/CactusConfig";
import axios, { AxiosError, AxiosInstance } from "axios";
import { isAxiosError } from "@shared/api/ApiTypes";
import Logger from "@shared/Logger"
import { stringifyJSON } from "@shared/util/ObjectUtil";
import * as ToneAnalyzerV3 from "ibm-watson/tone-analyzer/v3";
import { IamAuthenticator } from "ibm-watson/auth";
import { SentenceTone, ToneID, ToneResult, ToneScore } from "@shared/api/ToneAnalyzerTypes";
import WatsonToneAnalysis = ToneAnalyzerV3.ToneAnalysis;
import SentenceAnalysis = ToneAnalyzerV3.SentenceAnalysis;
import WatsonToneScore = ToneAnalyzerV3.ToneScore;

const logger = new Logger("ToneAnalyzerService");

export default class ToneAnalyzerService {
    protected static _shared: ToneAnalyzerService;

    static get shared(): ToneAnalyzerService {
        if (!ToneAnalyzerService._shared) {
            throw new Error("You must call ToneAnalyzerService.initialize before using the Tone Analyzer service.");
        }
        return ToneAnalyzerService._shared;
    }

    static initialize(config: CactusConfig) {
        ToneAnalyzerService._shared = new ToneAnalyzerService(config);
    }

    config: CactusConfig
    watsonApi: AxiosInstance;
    watsonTonePath = "/v3/tone";
    watsonApiVersion = "2017-09-21";

    watson: ToneAnalyzerV3;

    constructor(config: CactusConfig) {
        this.config = config;

        this.watson = new ToneAnalyzerV3({
            authenticator: new IamAuthenticator({ apikey: this.watsonApiKey }),
            version: this.watsonApiVersion,
        })

        this.watsonApi = axios.create({
            baseURL: `${ this.watsonApiUrl }${ this.watsonTonePath }`,
            headers: {
                "Content-Type": "application/json",
            },
            auth: {
                username: "apikey",
                password: this.watsonApiKey,
            }
        })
    }

    get watsonApiKey(): string {
        return this.config.watson.tone_analyzer.api_key;
    }

    get watsonApiUrl(): string {
        return this.config.watson.tone_analyzer.api_url;
    }

    logApiError(message: string, error: any): AxiosError | any {
        if (isAxiosError(error)) {
            logger.error(message, stringifyJSON(error.response?.data, 2))
        } else {
            logger.error(message, stringifyJSON(error, 2));
        }
    }

    async watsonBasicSdk(text?: string): Promise<ToneResult | undefined> {
        if (!text) {
            return undefined;
        }
        try {
            const watsonRequest = await this.watson.tone({ toneInput: { text }, sentences: true })
            const result = watsonRequest.result;
            return ToneAnalyzerService.fromWatsonAnalysis(result);
        } catch (error) {
            logger.error("failed to get watson tone analysis", error);
            return undefined;
        }
    }

    static toneIdFromWatsonToneId(id: string): ToneID {
        if (Object.keys(ToneID).includes(id)) {
            return id as ToneID;
        }
        return ToneID.unknown;
    }

    static fromWatsonToneScore(watson: WatsonToneScore): ToneScore {
        return {
            score: watson.score,
            toneId: ToneAnalyzerService.toneIdFromWatsonToneId(watson.tone_id),
            toneName: watson.tone_name,
        }
    }

    static fromWatsonSentence(watson: SentenceAnalysis): SentenceTone {
        return {
            sentenceId: watson.sentence_id,
            text: watson.text,
            tones: watson.tones?.map(ToneAnalyzerService.fromWatsonToneScore),
        }
    }

    static fromWatsonAnalysis(watson: WatsonToneAnalysis): ToneResult {


        return {
            documentTone: {
                tones: watson.document_tone.tones?.map(ToneAnalyzerService.fromWatsonToneScore)
            },
            sentencesTones: watson.sentences_tone?.map(ToneAnalyzerService.fromWatsonSentence),
        };

    }
}