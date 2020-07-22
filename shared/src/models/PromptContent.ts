import FlamelinkModel, { FlamelinkData, SchemaName } from "@shared/FlamelinkModel";
import { CactusElement } from "@shared/models/CactusElement";
import { isBlank, preventOrphanedWords } from "@shared/util/StringUtil";
import { timestampToDate } from "@shared/util/FirestoreUtil";
import { getFlamelinkDateStringInDenver } from "@shared/util/DateUtil";
import Logger from "@shared/Logger";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import CactusMember from "@shared/models/CactusMember";
import { CoreValue } from "@shared/models/CoreValueTypes";
import ReflectionResponse, { DynamicResponseValues } from "@shared/models/ReflectionResponse";
import { isNonEmptyObject, isNotNull, isString } from "@shared/util/ObjectUtil";

const logger = new Logger("PromptContent.ts");

export interface FlamelinkFile {
    fileIds?: string[]
}

export interface Image extends FlamelinkFile {
    url?: string,
    flamelinkFileName?: string,
    storageUrl?: string,
    fileIds?: string[],
    altText?: string
}

export function isImage(input?: Image | undefined | null): input is Image {
    return isNotNull(input) && (!isBlank(input?.url) || !isBlank(input?.storageUrl));
}

export interface Video extends FlamelinkFile {
    youtubeVideoId?: string,
    url?: string;
    fileIds?: string[];
}

export interface Audio extends FlamelinkFile {
    url?: string;
    // fileIds?: string[];
}

export enum ContentAction {
    next = "next",
    previous = "previous",
    complete = "complete",
    showPricing = "showPricing",
    coreValues = "coreValues",
    unknown = "unknown",
}

export enum LinkTarget {
    blank = "_blank",
    self = "_self",
    parent = "_parent",
    top = "_top"
}

export enum LinkStyle {
    buttonPrimary = "buttonPrimary",
    buttonSecondary = "buttonSecondary",
    fancyLink = "fancyLink",
    link = "link",
}

export interface ContentLink {
    linkLabel: string,
    destinationHref: string,
    linkTarget: LinkTarget,
    linkStyle: LinkStyle,
    appendMemberId?: boolean
}

export function isContentLink(link: ContentLink | any): link is ContentLink {
    if (!isNonEmptyObject(link)) {
        return false;
    }
    const l = link as ContentLink;
    return !isBlank(l.linkLabel) && !isBlank(l.destinationHref);
}

export interface ActionButton {
    action?: ContentAction,
    label?: string,
    linkStyle?: LinkStyle,
}

export function isActionButton(button: ActionButton | any): button is ActionButton {
    if (!isNonEmptyObject(button)) {
        return false;
    }
    const l = button as ActionButton;
    return !isBlank(l.label) && !isBlank(l.action);
}

export interface Quote {
    text: string,
    text_md?: string,
    authorName: string
    authorTitle?: string,
    authorAvatar?: Image;
}

export enum ContentImagePosition {
    top = "top",
    bottom = "bottom",
    center = "center"
}

export interface ContentBackgroundImage extends Image {
    position?: ContentImagePosition
}

export enum ContentType {
    text = "text",
    quote = "quote",
    video = "video",
    photo = "photo",
    audio = "audio",
    reflect = "reflect",
    elements = "elements",
    share_reflection = "share_reflection",
    invite = "invite",
    reflection_analysis = "reflection_analysis",
}

export enum ContentStatus {
    in_progress = "in_progress",
    submitted = "submitted",
    processing = "processing",
    needs_changes = "needs_changes",
    published = "published",
}

/**
 * Removes unneeded fields from the content for easier display
 * @return {Content}
 * @param params
 */
export function processContent(params: {
    promptContent: PromptContent,
    content: Content,
    member?: CactusMember | null | undefined,
    reflectionResponse?: ReflectionResponse | undefined
}): Content {
    const { content, member, reflectionResponse, promptContent } = params;

    const coreValue = reflectionResponse?.coreValue ?? undefined;
    const dynamicValues = reflectionResponse?.dynamicValues
    const processed: Content = {
        contentType: content.contentType,
        label: content.label,
        showElementIcon: content.showElementIcon,
        actionButton: (content.actionButton && content.actionButton.label && content.actionButton.action) ? content.actionButton : undefined,
        link: (content.link && content.link.destinationHref && content.link.linkLabel) ? content.link : undefined,
        backgroundImage: content.backgroundImage,
    };

    const dynamicText = promptContent.getDynamicDisplayText({ content, coreValue, member, dynamicValues })?.trim();

    switch (content.contentType) {
        case ContentType.text:
            processed.text = dynamicText
            processed.title = content.title;
            break;
        case ContentType.quote:
            processed.quote = content.quote;
            if (processed.quote?.text_md) {
                processed.quote.text = processed.quote.text_md.trim();
            }
            break;
        case ContentType.video:
            processed.text = dynamicText
            processed.video = content.video;
            break;
        case ContentType.photo:
            processed.text = dynamicText
            processed.photo = content.photo;
            break;
        case ContentType.audio:
            processed.text = dynamicText
            processed.audio = content.audio;
            break;
        case ContentType.reflect:
            processed.text = dynamicText
            break;
        case ContentType.share_reflection:
            processed.text = dynamicText
            processed.title = content.title;
            break;
        case ContentType.elements:
            processed.elements = true;
            processed.text = dynamicText
            processed.title = content.title;
            break;
        case ContentType.invite:
            processed.invite = true;
            break;
        default:
            logger.warn("UNHANDLED CONTENT TYPE", content.contentType);
    }

    processed.title = preventOrphanedWords(processed.title);
    processed.text = preventOrphanedWords(processed.text);
    processed.text_md = preventOrphanedWords(processed.text_md);
    if (processed.quote && processed.quote.text) {
        processed.quote.text = preventOrphanedWords(processed.quote.text)!;
    }

    // const [coreValue] = (member?.coreValues ?? []) as (CoreValue | undefined)[];
    // if (coreValue && content.coreValues?.textTemplateMd) {
    //     const coreValueMeta = CoreValuesService.shared.getMeta(coreValue)
    //     const token = content.coreValues?.valueReplaceToken ?? DEFAULT_CORE_VALUE_REPLACE_TOKEN
    //     processed.text = preventOrphanedWords(content.coreValues.textTemplateMd.replace(token, coreValueMeta.title));
    // }

    return processed;
}

export const DEFAULT_CORE_VALUE_REPLACE_TOKEN = "{{CORE_VALUE}}";


export interface DynamicPromptValue {
    /**
     * The string to replace in the template.
     * Default: {{VALUE}}
     */
    token: string;
    /**
     * The default value to use when valueRequired is false.
     */
    defaultValue?: string;
    /**
     * If TRUE, the client must be able to supply the substitution values -- using the default will not be used.
     * If a Dynamic Value is required but no value is provided, the fallback text will be used instead.
     */
    valueRequired?: boolean;
}

export interface DynamicContent {
    /**
     * The enabled flag must be set to TRUE or else the fallback value (`text` or `text_md`) will be used
     */
    enabled?: boolean;
    templateTextMd?: string
    dynamicValues?: DynamicPromptValue[]
}

export interface Content {
    contentType: ContentType;
    quote?: Quote;
    text?: string;
    text_md?: string;
    backgroundImage?: ContentBackgroundImage;
    label?: string;
    title?: string;
    video?: Video;
    photo?: Image;
    audio?: Audio;
    link?: ContentLink;
    elements?: boolean;
    invite?: boolean;
    actionButton?: ActionButton;
    showElementIcon?: boolean;
    coreValues?: {
        textTemplateMd?: string,
        valueReplaceToken?: string,
    }
    dynamicContent?: DynamicContent;
}

export enum PromptContentFields {
    promptId = "promptId",
    cactusElement = "cactusElement",
    scheduledSendAt = "scheduledSendAt",
    contentStatus = "contentStatus",
    subscriptionTiers = "subscriptionTiers",
}

export default class PromptContent extends FlamelinkModel {
    static Fields = PromptContentFields;
    schema = SchemaName.promptContent;
    promptId?: string;
    content: Content[] = [];
    subjectLine?: string;
    openGraphImage?: Image;
    scheduledSendAt?: Date;
    cactusElement?: CactusElement;
    mailchimpCampaignId?: string;
    mailchimpCampaignWebId?: string;
    contentStatus: ContentStatus = ContentStatus.in_progress;
    errorMessage?: string;
    topic?: string;
    shareReflectionCopy_md?: string;
    subscriptionTiers: SubscriptionTier[] = [];
    preferredCoreValueIndex?: number;

    constructor(data?: Partial<PromptContent>) {
        super(data);
        if (data) {
            Object.assign(this, data);
            this.promptId = data.promptId;
            this.content = data.content || [];
            this.subjectLine = data.subjectLine;
            this.cactusElement = data.cactusElement;

            if (data.scheduledSendAt) {
                this.scheduledSendAt = timestampToDate(data.scheduledSendAt) || new Date(data.scheduledSendAt);
            }
        }
    }

    prepareForFirestore(): any {
        const data = super.prepareForFirestore();

        if (this.scheduledSendAt) {
            data[PromptContent.Fields.scheduledSendAt] = getFlamelinkDateStringInDenver(this.scheduledSendAt)
        }

        return data;
    }

    updateFromData(data: FlamelinkData) {
        super.updateFromData(data);
        const scheduledDateField = data[PromptContent.Fields.scheduledSendAt];
        if (scheduledDateField) {
            this.scheduledSendAt = new Date(scheduledDateField);
        } else {
            this.scheduledSendAt = undefined;
        }
    }

    getQuestionContent(): Content | undefined {
        return this.content?.find(c => c.contentType === ContentType.reflect);
    }

    getQuestion(): string | undefined {
        const content = this.getQuestionContent()
        if (content && !isBlank(content?.text_md)) {
            return content.text_md;
        }
        return content?.text;
    }

    getPreviewText(): string | undefined {
        const [first] = (this.content || []);
        if (first && !isBlank(first.text_md)) {
            return first.text_md;
        }
        return first?.text;
    }

    getDynamicPreviewText(params: {
        member?: CactusMember,
        coreValue?: CoreValue | undefined,
        dynamicValues?: DynamicResponseValues
    }): string | undefined {
        const { member, coreValue, dynamicValues } = params;
        const [content] = (this.content || []);
        if (!content) {
            return undefined;
        }
        return this.getDynamicDisplayText({ member, coreValue, content, dynamicValues });
    }


    getOpenGraphImageUrl(): string | null {
        const firstImageCard = (this.content || []).find(c => c.backgroundImage?.storageUrl);
        return this.openGraphImage?.storageUrl || firstImageCard?.backgroundImage?.storageUrl || null;
    }

    getDynamicQuestionText(params: {
        member?: CactusMember,
        coreValue?: CoreValue | undefined,
        dynamicValues?: DynamicResponseValues
    }): string | undefined {
        const { member, coreValue, dynamicValues } = params;
        const content = this.content?.find(c => c.contentType === ContentType.reflect);
        if (!content) {
            return;
        }
        return this.getDynamicDisplayText({ member, coreValue, content, dynamicValues });
    }

    /**
     * Get text with core values substituted, if applicable. Returns markdown-able text,
     * @param {{
     *  content: Content,
     *  member?: CactusMember | undefined,
     *  coreValue?: CoreValue | undefined
     *  }} params
     * @return {string|undefined}
     */
    getDynamicDisplayText(params: {
        content: Content,
        member?: CactusMember | undefined | null,
        coreValue?: CoreValue | null | undefined,
        dynamicValues?: DynamicResponseValues,
    }): string | undefined {
        const { content, member, coreValue, dynamicValues } = params;

        let text = !isBlank(content.text_md) ? content.text_md : content.text;

        const coreValueTemplate = content.coreValues?.textTemplateMd;
        const token = content.coreValues?.valueReplaceToken ?? DEFAULT_CORE_VALUE_REPLACE_TOKEN;
        const coreValueIndex = this.preferredCoreValueIndex ?? 0;
        const value = coreValue ?? member?.getCoreValueAtIndex(coreValueIndex);
        if (value && coreValueTemplate && !isBlank(coreValueTemplate)) {
            text = coreValueTemplate.replace(token, value);
        }
        const dynamicText = this.buildDynamicContent({ content, member, coreValue, dynamicValues })
        return dynamicText ?? text;
    }

    buildDynamicContent(params: {
        content: Content,
        member?: CactusMember | undefined | null,
        coreValue?: CoreValue | null | undefined,
        dynamicValues?: DynamicResponseValues,
    }): string | undefined {
        const {
            content,
            dynamicValues = {}
        } = params;
        const dynamicContent = content.dynamicContent;
        const enabled = dynamicContent?.enabled === true;
        //if not enabled, return undefined
        if (!dynamicContent || !enabled) {
            return undefined;
        }

        //if the dynamic content does not have a template string or is blank, return undefined
        const templateTextMd = dynamicContent.templateTextMd
        if (!isString(templateTextMd) || isBlank(templateTextMd)) {
            return undefined;
        }

        //if the replacer values list is empty, return undefined (nothing to substitute)
        const replacements = dynamicContent.dynamicValues ?? []
        if (replacements.length === 0) {
            return undefined;
        }

        //ensure all required values have a replacer
        const allReplacementsValid = replacements.every(r => {
            const validToken = !isBlank(r.token);
            const hasValue = !isBlank(dynamicValues[r.token]);
            const hasDefault = !isBlank(r.defaultValue);
            if (!validToken) {
                logger.info(`The token "${ r.token }" was invalid, returning error`)
                return false
            }
            if (hasValue) {
                logger.info(`"The token has as value, "${ r.token }" is valid!"`)
                return true;
            } else if (r.valueRequired) {
                logger.info(`A value is required for the token ${ r.token } but it was not found. Invalid replacer`)
                return false;
            }

            if (!hasDefault) {
                logger.info(`The default value of ${ r.defaultValue } was not valid for token ${ r.token }`);
            }
            return hasDefault;
        })
        if (!allReplacementsValid) {
            logger.info("Not all replacement values were valid")
            return undefined;
        }

        //process all replacements
        const processedText = replacements.reduce((text, replacement) => {
            const token = replacement.token;
            const value = dynamicValues[token] ?? replacement.defaultValue ?? ""
            return text?.replace(token, value);
        }, templateTextMd);

        logger.info(`Dynamic Content Processed Text\nTemplate=${ templateTextMd }\nProcessed=${ processedText }`);
        return processedText;
    }
}