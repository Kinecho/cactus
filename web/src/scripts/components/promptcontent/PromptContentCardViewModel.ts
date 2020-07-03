import ReflectionResponse, { DynamicResponseValues } from "@shared/models/ReflectionResponse";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent, { Content, ContentType, Image, Quote, Video } from "@shared/models/PromptContent";
import Logger from "@shared/Logger"
import CactusMember from "@shared/models/CactusMember";
import { isBlank } from "@shared/util/StringUtil";
import { CactusElement } from "@shared/models/CactusElement";

const logger = new Logger("PromptContentCardViewModel");

export interface QuoteModel {
    text: string,
    authorName?: string,
    authorTitle?: string,
}

export default class PromptContentCardViewModel {
    responses: ReflectionResponse[] | null = null;
    prompt: ReflectionPrompt;
    promptContent: PromptContent;
    content: Content;
    member: CactusMember;

    constructor(params: { prompt: ReflectionPrompt, promptContent: PromptContent, content: Content, responses?: ReflectionResponse[] | null, member: CactusMember }) {
        const { prompt, promptContent, content, responses = null, member } = params;
        this.prompt = prompt;
        this.promptContent = promptContent;
        this.content = content;
        this.responses = responses;
        this.member = member;
    }

    get type(): ContentType {
        return this.content.contentType;
    }

    get element(): CactusElement | null {
        return this.promptContent.cactusElement ?? null;
    }

    get text(): string | null | undefined {
        const dynamicValues: DynamicResponseValues | undefined = this.responses?.reduce((values, response) => {
            Object.assign(values, response.dynamicValues);
            return values;
        }, {});
        const coreValue = this.responses?.find(r => r.coreValue)?.coreValue;
        return this.promptContent.getDynamicDisplayText({
            content: this.content,
            member: this.member,
            dynamicValues,
            coreValue
        })
    }

    get photo(): Image | undefined | null {
        return this.content.photo;
    }

    get video(): Video | null {
        const video = this.content.video
        if (isBlank(video?.youtubeVideoId) && isBlank(video?.url)) {
            return null;
        }
        return video ?? null;
    }

    get quote(): QuoteModel | null {
        const quote = this.content.quote;
        if (!quote) {
            return null;
        }

        const model: QuoteModel = {
            text: quote.text_md ?? quote.text,
            authorName: quote.authorName,
            authorTitle: quote.authorTitle,
        }

        return !isBlank(model.text) ? model : null;
    }

    static createAll(params: { prompt: ReflectionPrompt, promptContent: PromptContent, responses: ReflectionResponse[] | null, member: CactusMember }): PromptContentCardViewModel[] {
        const { prompt, promptContent, responses, member } = params;
        const models: PromptContentCardViewModel[] = promptContent.content.map(content => {
            return new PromptContentCardViewModel({ prompt, promptContent, responses, content, member });
        });
        logger.info(`Created ${ models.length } view models`);
        return models;
    }
}