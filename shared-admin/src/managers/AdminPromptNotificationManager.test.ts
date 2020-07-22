import CactusMember, { NotificationStatus } from "@shared/models/CactusMember";
import { buildMockConfig } from "@admin/config/configService";
import AdminPromptNotificationManager from "@admin/managers/AdminPromptNotificationManager";
import { DateTime } from "luxon";
import ReflectionResponse from "@shared/models/ReflectionResponse";

describe("is member's last email", () => {
    AdminPromptNotificationManager.initialize(buildMockConfig());
    const manager = AdminPromptNotificationManager.shared;

    test("is not last email if no lastReplyAt is set and email is active", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = undefined;
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeFalsy();
    })

    test("is last email for Member if lastReply is more than 30 days ago, and the email is active", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = DateTime.local().minus({ days: 90 }).toJSDate();
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeTruthy();
    })

    test("is last email for Member if lastReply is less than 30 days ago, and the email is active", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = DateTime.local().minus({ days: 10 }).toJSDate();
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeFalsy();
    })

    test("is not last email for Member if lastReply is more than 30 days ago, and the email is active, but admin unsubscribe is less than 30 days ago", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = DateTime.local().minus({ days: 90 }).toJSDate();
        member.adminEmailUnsubscribedAt = DateTime.local().minus({ days: 5 }).toJSDate();

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeFalsy();
    })

    test("is last email for Member if lastReply is more than 30 days ago, and the email is active, and admin unsubscribe is more than 30 days ago", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = DateTime.local().minus({ days: 90 }).toJSDate();
        member.adminEmailUnsubscribedAt = DateTime.local().minus({ days: 40 }).toJSDate();

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeTruthy();
    })

    test("isLastEmail is false if the member's email is not active", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.INACTIVE;
        member.lastReplyAt = DateTime.local().minus({ days: 90 }).toJSDate();
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeFalsy();
    })

    test("isLastEmail is false if the member's reflection response is recent", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = undefined
        member.adminEmailUnsubscribedAt = undefined;

        const response = new ReflectionResponse();
        response.createdAt = DateTime.local().minus({ days: 10 }).toJSDate();

        const isLastEmail = manager.isLastEmail(member, response);
        expect(isLastEmail).toBeFalsy();
    })

    test("isLastEmail is true if the member's latest reflection response is old, and no lastReply is set", () => {
        const member = new CactusMember();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = undefined
        member.adminEmailUnsubscribedAt = undefined;

        const response = new ReflectionResponse();
        response.createdAt = DateTime.local().minus({ days: 100 }).toJSDate();

        const isLastEmail = manager.isLastEmail(member, response);
        expect(isLastEmail).toBeTruthy();
    })

    test("isLastEmail is true when no reflections, no lastreflected at, and member was created 100 days ago", () => {
        const member = new CactusMember();
        member.createdAt = DateTime.local().minus({ days: 100 }).toJSDate();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = undefined
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeTruthy();
    })

    test("isLastEmail is false when no reflections, no lastreflected at, and member was created recently", () => {
        const member = new CactusMember();
        member.createdAt = DateTime.local().minus({ days: 4 }).toJSDate();
        member.notificationSettings.email = NotificationStatus.ACTIVE;
        member.lastReplyAt = undefined
        member.adminEmailUnsubscribedAt = undefined;

        const isLastEmail = manager.isLastEmail(member);
        expect(isLastEmail).toBeFalsy();
    })
})