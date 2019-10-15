import {ISODate} from "@shared/mailchimp/models/MailchimpTypes";
import FlamelinkModel, {SchemaName} from "@shared/FlamelinkModel";
import {FlamelinkTimestamp} from "@shared/types/FlamelinkWebhookTypes";
import {CactusElement} from "@shared/models/CactusElement";

export interface FlamelinkFile {
    fileIds?: string[]
}

export interface Image extends FlamelinkFile {
    url?: string,
    flamelinkFileName?: string,
    storageUrl?: string,
    fileIds?: string[]
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
        default:
            console.warn("UNHANDLED CONTENT TYPE", content.contentType);

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
    actionButton?: ActionButton;
    showElementIcon?: boolean;
}


export default class PromptContent extends FlamelinkModel {
    schema = SchemaName.promptContent;
    promptId?: string;
    content: Content[] = [];
    subjectLine?: string;
    openGraphImage?: Image;
    scheduledSendAt?: ISODate | Date | FlamelinkTimestamp;
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
            this.scheduledSendAt = data.scheduledSendAt
        }

    }

    getQuestion(): string | undefined {
        if (this.content) {
            const reflectCard = this.content.find(c => c.contentType === ContentType.reflect);
            return reflectCard && reflectCard.text;
        }
        return;
    }

}