
export interface Image {
    url?: string
}

export interface Video {
    youtubeEmbedUrl?:string;
    url?:string;
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

export enum ScreenType {
    reflect = "reflect",
    content = "content",
    intention = "intention",
}

export interface Content {
    screenType: ScreenType;
    quote?: Quote;
    text?: string;
    backgroundImage?: ContentBackgroundImage;
    label?: string;
    video?:Video;
    image?: Image;
}

export default class PromptContent {
    id?:string;
    promptId?:string;
    content: Content[] = []
}