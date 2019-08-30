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
        CELEBRATIONS: ["Well done!", "Nice work!", "Way to go!"],
        REFLECTIONS: "Reflections",
        SECONDS: "Seconds",
        MINUTES: "Minutes",
        DAY_STREAK: "Day Streak",
        GO_HOME: "Go Home",
        SIGN_UP_MESSAGE: "Sign Up to Save Your Progress",
    };
    settings = {
        dates: {
            longFormat: "LLLL d, yyyy",
            shortFormat: "L/d/yy",
        }
    }

}