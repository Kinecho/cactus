import ReflectionResponse, { DynamicResponseValues } from "@shared/models/ReflectionResponse";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import PromptContent, {
    ActionButton,
    Audio,
    Content,
    ContentBackgroundImage, ContentLink,
    ContentType,
    Image, isActionButton, isContentLink,
    isImage,
    Video
} from "@shared/models/PromptContent";
import Logger from "@shared/Logger"
import CactusMember from "@shared/models/CactusMember";
import { getResponseText, isBlank } from "@shared/util/StringUtil";
import { CactusElement } from "@shared/models/CactusElement";
import { isNull } from "@shared/util/ObjectUtil";

const logger = new Logger("PromptContentCardViewModel");

export interface QuoteModel {
    text: string,
    authorName?: string,
    authorTitle?: string,
    avatar?: Image,
}

export enum CardType {
    text = "text-card",
    photo = "photo-card",
    quote = "quote-card",
    reflect = "reflect-card",
    video = "video-card",
    reflection_analysis = "reflection-analysis-card",
    elements = "elements-card",
    share_note = "share-note-card",
    audio = "audio-card",
    invite_friends = "invite-friend-card",
    milestones = "milestones",
}

export interface PromptCardViewModel {
    cardType: CardType | null;
    prompt: ReflectionPrompt,
    promptContent: PromptContent,
    responses: ReflectionResponse[] | null,
    member: CactusMember,
}

export function isPromptContentCardViewModel(input: PromptCardViewModel): input is PromptContentCardViewModel {
    const vm = input as PromptContentCardViewModel
    return !isNull(vm.type) && !isNull(vm.promptContent)
}

export default class PromptContentCardViewModel implements PromptCardViewModel {
    responses: ReflectionResponse[] | null = null;
    prompt: ReflectionPrompt;
    promptContent: PromptContent;
    member: CactusMember;
    content: Content;

    get cardType(): CardType | null {
        switch (this.type) {
            case ContentType.text:
                return CardType.text;
            case ContentType.photo:
                return CardType.photo;
            case ContentType.reflect:
                return CardType.reflect;
            case ContentType.quote:
                return CardType.quote;
            case ContentType.video:
                return CardType.video;
            case ContentType.reflection_analysis:
                return CardType.reflection_analysis;
            case ContentType.elements:
                return CardType.elements;
            case ContentType.share_reflection:
                return CardType.share_note;
            case ContentType.audio:
                return CardType.audio;
            case ContentType.invite:
                return CardType.invite_friends;
            default:
                return null
        }
    }

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

    get noteShared(): boolean {
        return this.responses?.some(r => r.shared) ?? false;
    }

    get photo(): Image | undefined | null {
        return isImage(this.content.photo) ? this.content.photo : null;
    }

    get backgroundImage(): ContentBackgroundImage | null {
        if (isImage(this.content.backgroundImage)) {
            return this.content.backgroundImage
        }
        return null;
    }

    get audio(): Audio | null {
        return this.content.audio ?? null;
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
            avatar: isImage(quote.authorAvatar) ? quote.authorAvatar : undefined,
        }

        return !isBlank(model.text) ? model : null;
    }

    get responseText(): string | null {
        const responses = this.responses ?? []
        if (responses.length > 0) {
            return responses.map(r => r.content.text).join("\n\n").trim();
        }
        return null;
    }

    get link(): ContentLink | null {
        if (isContentLink(this.content.link)) {
            return this.content.link;
        }
        return null;
    }

    get actionButton(): ActionButton | null {
        if (isActionButton(this.content.actionButton)) {
            return this.content.actionButton;
        }
        return null;
    }

    static createReflectionAnalysis(params: {
        prompt: ReflectionPrompt,
        promptContent: PromptContent,
        responses: ReflectionResponse[] | null,
        member: CactusMember,
    }): PromptContentCardViewModel {
        const { prompt, promptContent, responses, member } = params;
        const content: Content = {
            contentType: ContentType.reflection_analysis,
        }
        return new PromptContentCardViewModel({ prompt, promptContent, responses, content, member });
    }

    static createMilestoneCard(params: {
        prompt: ReflectionPrompt,
        promptContent: PromptContent,
        responses: ReflectionResponse[] | null,
        member: CactusMember,
    }): PromptCardViewModel {
        const { prompt, promptContent, responses, member } = params;
        return {
            cardType: CardType.milestones,
            prompt,
            promptContent,
            responses,
            member,
        };
    }

    static createShareNote(params: {
        prompt: ReflectionPrompt,
        promptContent: PromptContent,
        responses: ReflectionResponse[] | null,
        member: CactusMember
    }): PromptContentCardViewModel {
        const { prompt, promptContent, responses, member } = params;
        const content: Content = {
            contentType: ContentType.share_reflection,
        }
        return new PromptContentCardViewModel({ prompt, promptContent, responses, content, member });
    }

    static createAll(params: {
        prompt: ReflectionPrompt,
        promptContent: PromptContent,
        responses: ReflectionResponse[] | null,
        member: CactusMember
    }): PromptCardViewModel[] {
        logger.info("Creating cards....");
        const { prompt, promptContent, responses, member } = params;
        let lastReflectIndex: number | null = null;
        let hasInsightsAnalysis = false;
        let showMilestoneCard = (member.stats.reflections?.totalCount ?? 0) < 8;
        const models: PromptCardViewModel[] = promptContent.content.filter(c => {
            if (c.contentType === ContentType.share_reflection && isBlank(getResponseText(responses))) {
                return false;
            }
            return true;
        }).map((content, i) => {
            if (content.contentType === ContentType.reflect) {
                lastReflectIndex = i;
            } else if (content.contentType === ContentType.reflection_analysis) {
                hasInsightsAnalysis = true;
            }
            return new PromptContentCardViewModel({ prompt, promptContent, responses, content, member });
        });

        if (lastReflectIndex !== null && !hasInsightsAnalysis) {
            const insightsCard = PromptContentCardViewModel.createReflectionAnalysis(params);
            models.splice(lastReflectIndex + 1, 0, insightsCard)
        }

        if (showMilestoneCard) {
            models.push(PromptContentCardViewModel.createMilestoneCard({
                prompt,
                promptContent,
                responses,
                member
            }))
        }

        logger.info(`Created ${ models.length } view models`);
        return models;
    }

    static createMocks(contentItems?: Content[]): PromptCardViewModel[] {
        const promptId = "p123";
        const memberId = "m123";
        const promptContentId = "c123";
        const prompt: ReflectionPrompt = new ReflectionPrompt();
        prompt.id = promptId;

        const promptContent = new PromptContent();
        promptContent.entryId = promptContentId;
        promptContent.promptId = promptId;
        promptContent.content = contentItems ?? [];
        const member = new CactusMember();
        member.id = memberId;
        member.email = "test@cactus.app";

        const responses: ReflectionResponse[] = [];

        return PromptContentCardViewModel.createAll({
            prompt,
            promptContent,
            member,
            responses
        });
    }
}