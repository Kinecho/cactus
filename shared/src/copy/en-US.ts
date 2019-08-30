import {LocalizedCopy} from "@shared/copy/CopyTypes";

export default class EnglishCopy extends LocalizedCopy {
    prompts = {
        EDIT_NOTE: "Edit Note",
        REFLECT: "Reflect",
        SHARE_PROMPT: "Share Prompt",
        ADD_A_NOTE: "Add a Note",
        DONE: "Done",
        CLOSE: "Close",
        TAP_ANYWHERE: "Tap Anywhere",
        SAVED: "Saved",
        SAVING: "Saving",
    };
    settings = {
        dates: {
            longFormat: "LLLL d, yyyy",
            shortFormat: "L/d/yy",
        }
    }

}