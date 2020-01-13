import FlamelinkModel, {FlamelinkData, SchemaName} from "@shared/FlamelinkModel";
import {CactusElement} from "@shared/models/CactusElement";
import {preventOrphanedWords} from "@shared/util/StringUtil";
import {timestampToDate} from "@shared/util/FirestoreUtil";
import {getFlamelinkDateStringInDenver} from "@shared/util/DateUtil";

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
}

enum LinkTarget {
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
}

export interface ActionButton {
    action: ContentAction,
    label: string,
}

export interface Quote {
    text: string,
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
 * @param {Content} content
 * @return {Content}
 */
export function processContent(content: Content): Content {
    const processed: Content = {
        contentType: content.contentType,
        label: content.label,
        showElementIcon: content.showElementIcon,
        actionButton: (content.actionButton && content.actionButton.label && content.actionButton.action) ? content.actionButton : undefined,
        link: (content.link && content.link.destinationHref && content.link.linkLabel) ? content.link : undefined,
        backgroundImage: content.backgroundImage,
    };

    switch (content.contentType) {
        case ContentType.text:
            processed.text = content.text_md || content.text;
            processed.title = content.title;
            break;
        case ContentType.quote:
            processed.quote = content.quote;
            break;
        case ContentType.video:
            processed.text = content.text_md || content.text;
            processed.video = content.video;
            break;
        case ContentType.photo:
            processed.text = content.text_md || content.text;
            processed.photo = content.photo;
            break;
        case ContentType.audio:
            processed.text = content.text_md || content.text;
            processed.audio = content.audio;
            break;
        case ContentType.reflect:
            processed.text = content.text_md || content.text;
            break;
        case ContentType.share_reflection:
            processed.text = content.text_md || content.text;
            processed.title = content.title;
            break;
        case ContentType.elements:
            processed.elements = true;
            processed.text = content.text_md || content.text;
            processed.title = content.title;
            break;
        case ContentType.invite:
            processed.invite = true;
            break;
        default:
            console.warn("UNHANDLED CONTENT TYPE", content.contentType);
    }

    processed.title = preventOrphanedWords(processed.title);
    processed.text = preventOrphanedWords(processed.text);
    processed.text_md = preventOrphanedWords(processed.text_md);
    if (processed.quote && processed.quote.text) {
        processed.quote.text = preventOrphanedWords(processed.quote.text)!;
    }
    return processed;
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
}

export enum PromptContentFields {
    promptId = "promptId",
    cactusElement = "cactusElement",
    scheduledSendAt = "scheduledSendAt",
    contentStatus = "contentStatus",
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

    constructor(data?: Partial<PromptContent>) {
        super(data);
        if (data) {
            Object.assign(this, data);
            this.promptId = data.promptId;
            this.content = data.content || [];
            this.subjectLine = data.subjectLine;
            this.cactusElement = data.cactusElement;

            if (data.scheduledSendAt) {
                console.log("PromptContent Constructor, setting scheduled send at from value", data.scheduledSendAt);
                this.scheduledSendAt = timestampToDate(data.scheduledSendAt) || new Date(data.scheduledSendAt);
                console.log("PromptContent constructor, sent scheduledSendAt to ", this.scheduledSendAt)
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
            console.log("Setting scheduledSendAt from data value", scheduledDateField);
            this.scheduledSendAt = new Date(scheduledDateField);
        } else {
            this.scheduledSendAt = undefined;
        }
    }

    getQuestion(): string | undefined {
        if (this.content) {
            const reflectCard = this.content.find(c => c.contentType === ContentType.reflect);
            return reflectCard && reflectCard.text;
        }
        return;
    }

    getPreviewText(): string|undefined {
        const [first] = (this.content || []);
        return first?.text;
    }
}