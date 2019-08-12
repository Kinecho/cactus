
export interface Image {
    url?: string
}

export interface Video {
    youtubeEmbedUrl?:string;
    url?:string;
}

export enum ContentButtonAction {
    next = "next",
    previous = "previous",
    complete = "complete",
    path = "path"
}

export interface ContentButton {
    label: string,
    action: ContentButtonAction,
    path?:string,
}

export interface Quote {
    text: string,
    authorName: string
    authorTitle?: string,
    avatarImage?: Image;
}

export enum ContentImagePosition {
    top = "top",
    bottom = "bottom",
    center = "center"
}

export interface ContentBackgroundImage {
    position?: ContentImagePosition
    image: Image,
}

export enum ContentType {
    reflect = "reflect",
    content = "content",
    intention = "intention",
}

export interface Content {
    contentType: ContentType;
    quote?: Quote;
    text?: string;
    backgroundImage?: ContentBackgroundImage;
    label?: string;
    video?:Video;
    image?: Image;
    actionButton?: ContentButton
}

export default class PromptContent {
    id?:string;
    promptId?:string;
    content: Content[] = []
}