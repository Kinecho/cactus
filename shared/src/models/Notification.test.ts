import Notification, {
    EmailCreateParams,
    NotificationChannel,
    NotificationContentType,
    NotificationType,
    PushCreateParams,
    SendStatus
} from "@shared/models/Notification";
import { Collection } from "@shared/FirestoreBaseModels";
import { SendgridTemplate } from "@shared/models/EmailLog";

test("Build unique id with all params", () => {
    expect(Notification.uniqueByDateObject(
    { month: 6, year: 2020, day: 22 })
    ).toEqual("2020-06-22");
})

test("Create a push notification using static method", () => {
    const params: PushCreateParams = {
        memberId: "m1",
        contentId: "c1",
        contentType: NotificationContentType.promptContent,
        type: NotificationType.NEW_PROMPT,
        data: { badgeCount: 1, body: "hello body", title: "Hello title" },
    };
    const log = Notification.createPush(params);

    expect(log).toEqual({
        ...params,
        deleted: false,
        status: SendStatus.NOT_ATTEMPTED,
        collection: Collection.notifications,
        fcmTokens: undefined,
        uniqueBy: undefined,
        channel: NotificationChannel.PUSH
    })
})


test("Create an email notification using static method", () => {
    const params: EmailCreateParams = {
        memberId: "m1",
        contentId: "c1",
        contentType: NotificationContentType.promptContent,
        type: NotificationType.NEW_PROMPT,
        sendgridTemplateId: SendgridTemplate.new_prompt_notification,
        email: "neil@cactus.app",
        data: { title: "Hello" },
        uniqueBy: "some_value"
    };
    const log = Notification.createEmail(params);

    expect(log).toEqual({
        ...params,
        deleted: false,
        status: SendStatus.NOT_ATTEMPTED,
        collection: Collection.notifications,
        email: "neil@cactus.app",
        sendgridTemplateId: SendgridTemplate.new_prompt_notification,
        channel: NotificationChannel.EMAIL,
        uniqueBy: "some_value"
    })
})
