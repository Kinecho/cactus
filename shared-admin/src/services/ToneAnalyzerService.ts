import { CactusConfig } from "@admin/CactusConfig";
import axios, { AxiosInstance, AxiosError } from "axios";
import { isAxiosError } from "@shared/api/ApiTypes";
import Logger from "@shared/Logger"
import { stringifyJSON } from "@shared/util/ObjectUtil";

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
    api: AxiosInstance;
    tonePath = "/v3/tone";
    apiVersion = "2017-09-21";

    constructor(config: CactusConfig) {
        this.config = config;
        this.api = axios.create({
            baseURL: `${ this.apiUrl }${ this.tonePath }`,
            headers: {
                "Content-Type": "application/json",
            },
            auth: {
                username: "apikey",
                password: this.apiKey,
            }
        })
    }

    get apiKey(): string {
        return this.config.watson.tone_analyzer.api_key;
    }

    get apiUrl(): string {
        return this.config.watson.tone_analyzer.api_url;
    }

    logApiError(message: string, error: any): AxiosError | any {
        if (isAxiosError(error)) {
            logger.error(message, stringifyJSON(error.response?.data, 2))
        } else {
            logger.error(message, stringifyJSON(error, 2));
        }
    }

    async basicTextAnalysis(text: string): Promise<any | undefined> {
        try {
            const response = await this.api.get("", {
                params: {
                    version: this.apiVersion,
                    text
                }
            })
            const data = response?.data
            logger.info(data);
            return data;
        } catch (error) {
            this.logApiError("Failed to get basic text analysis", error);
            return undefined;
        }
    }
}