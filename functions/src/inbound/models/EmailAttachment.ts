

export interface InboundAttachmentInfo {
    filename?: string;
    name?: string;
    type?: string;
    "content-id"?: string;
}


export default class EmailAttachment{
    filename?: string;
    name?: string;
    type?: string;
    contentId?: string;


    constructor(input: InboundAttachmentInfo) {
        this.filename = input.filename;
        this.name = input.name;
        this.type = input.type;
        this.contentId = input["content-id"];
    }

}