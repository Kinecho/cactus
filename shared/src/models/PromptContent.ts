
export interface Image {
    url?: string
}

export interface ContentFile {
    idontknowyet: any,
}

export interface Video {
    youtubeEmbedUrl?:string;
    url?:string;
    file?: ContentFile;
}

export enum ContentButtonAction {
    next = "next",
    previous = "previous",
    complete = "complete",
    navigate = "navigate"
}

enum LinkTarget {
    blank = "_blank",
    self = "_self",
    parent = "_parent",
    top = "_top"
}

export interface NavigationInfo {
    href: string,
    target: LinkTarget,
}

export interface ContentButton {
    label: string,
    action: ContentButtonAction,
    navigation?: NavigationInfo,
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
    imageIds: string[],
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
    button?: ContentButton
}

export default class PromptContent {
    id?:string;
    promptId?:string;
    content: Content[] = []
}