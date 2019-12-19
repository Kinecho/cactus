import {DateObject} from "luxon";
import {PromptSendTime} from "@shared/models/CactusMember";

export function isSendTimeWindow(args: {
    currentDate?: DateObject | PromptSendTime,
    sendTime?: PromptSendTime,
}): boolean {
    const {currentDate, sendTime} = args;

    if (!currentDate || !sendTime) {
        return false;
    }

    return currentDate.hour === sendTime.hour &&
        (currentDate.minute || 0) >= sendTime.minute &&
        (currentDate.minute || 0) < sendTime.minute + 15;
}