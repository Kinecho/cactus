import {isSendTimeWindow} from "@shared/util/NotificationUtil";
import {PromptSendTime} from "@shared/models/CactusMember";

describe("isSendTimeWindow", () => {
    test("matches window", () => {
        const sendTime: PromptSendTime = {hour: 12, minute: 15};
        expect(isSendTimeWindow({
            currentDate: {hour: 12, minute: 15,}, sendTime
        })).toBeTruthy();

        expect(isSendTimeWindow({
            currentDate: {hour: 12, minute: 16,}, sendTime
        })).toBeTruthy();

        expect(isSendTimeWindow({
            currentDate: {hour: 12, minute: 29,}, sendTime
        })).toBeTruthy();

        expect(isSendTimeWindow({
            currentDate: {hour: 12, minute: 20,}, sendTime
        })).toBeTruthy();
    });

    test("right hour, wrong minute", () => {
        const sendTime: PromptSendTime = {hour: 12, minute: 15};
        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 14,
                millisecond: 0
            }, sendTime,
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 30,
            }, sendTime
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 33,
            }, sendTime
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 45,
            }, sendTime
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 56,
                millisecond: 0
            }, sendTime
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 12,
                minute: 0,
                millisecond: 0
            }, sendTime
        })).toBeFalsy();
    });

    test("wrong hour, right minute", () => {
        const sendTime: PromptSendTime = {hour: 12, minute: 15};
        expect(isSendTimeWindow({
            currentDate: {
                hour: 10,
                minute: 15,
                millisecond: 0
            }, sendTime
        })).toBeFalsy();

        expect(isSendTimeWindow({
            currentDate: {
                hour: 9,
                minute: 15,
                millisecond: 0
            }, sendTime
        })).toBeFalsy();
    });
});