import CactusMember from "@shared/models/CactusMember";
import { CoreValue } from "@shared/models/CoreValueTypes";
import { BillingPlatform, CancellationReasonCode } from "@shared/models/MemberSubscription";
import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
import { OfferDetails } from "@shared/models/PromotionalOffer";
import Logger from "@shared/Logger"
import { fromFirestoreData, TimestampInterface } from "@shared/util/FirestoreUtil";
import * as firebase from "firebase";
import Timestamp = firebase.firestore.Timestamp;

const logger = new Logger("CactusMember.test");

describe("core values getters", () => {
    test("get core value - with values", () => {
        const member = new CactusMember();
        member.coreValues = [CoreValue.Abundance, CoreValue.Accomplishment, CoreValue.Achievement];
        expect(member.getCoreValueAtIndex()).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(0)).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(1)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(2)).toEqual(CoreValue.Achievement);

        //should "loop through" values using modulo
        expect(member.getCoreValueAtIndex(3)).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(4)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(5)).toEqual(CoreValue.Achievement);
        expect(member.getCoreValueAtIndex(6)).toEqual(CoreValue.Abundance);

        expect(member.getCoreValueAtIndex(7)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(8)).toEqual(CoreValue.Achievement);
        expect(member.getCoreValueAtIndex(9)).toEqual(CoreValue.Abundance);
    })

    test("get core value - undefined core values on their profile", () => {
        const member = new CactusMember();
        member.coreValues = undefined;
        expect(member.getCoreValueAtIndex(1)).toBeUndefined();
        expect(member.getCoreValueAtIndex()).toBeUndefined()
        expect(member.getCoreValueAtIndex(10)).toBeUndefined()
        expect(member.getCoreValueAtIndex(2)).toBeUndefined()
    })

    test("get core value - empty array values on their profile", () => {
        const member = new CactusMember();
        member.coreValues = [];
        expect(member.getCoreValueAtIndex(1)).toBeUndefined();
        expect(member.getCoreValueAtIndex()).toBeUndefined()
        expect(member.getCoreValueAtIndex(10)).toBeUndefined()
        expect(member.getCoreValueAtIndex(2)).toBeUndefined()
    })
})


describe("encode/decode JSON", () => {
    test("encode timestamps returns numbers", () => {
        const model = new CactusMember();
        const date = new Date();
        model.id = "one";
        model.createdAt = date;
        model.updatedAt = date;
        model.deletedAt = date;

        model.subscription = {
            tier: SubscriptionTier.PLUS,
            optOutTrial: {
                startedAt: date,
                endsAt: date,
                billingPlatform: BillingPlatform.APPLE,
            }
        }

        const json = model.toJSON();

        expect(json.createdAt).toEqual(date.getTime());
        expect(json.updatedAt).toEqual(date.getTime());
        expect(json.deletedAt).toEqual(date.getTime());
        expect(json.subscription.tier).toEqual("PLUS");
        expect(json.subscription.optOutTrial.startedAt).toEqual(date.getTime())
        expect(json.subscription.optOutTrial.endsAt).toEqual(date.getTime())
        expect(json.subscription.optOutTrial.billingPlatform).toEqual("APPLE")
        expect(json.id).toEqual("one");
    })

    test("decode timestamps returns dates", () => {
        const date = new Date();
        const json = {
            id: "one",
            createdAt: date.getTime(),
            updatedAt: date.getTime(),
            deletedAt: date.getTime(),
            unsubscribedAt: date.getTime(),
            signupAt: date.getTime(),
            signupConfirmedAt: date.getTime(),
            lastSyncedAt: date.getTime(),
            lastReplyAt: date.getTime(),
            lastJournalEntryAt: date.getTime(),
            adminEmailUnsubscribedAt: date.getTime(),
            activityStatus: {
                lastSeenOccurredAt: date.getTime(),
            },
            subscription: {
                tier: "PLUS",
                optOutTrial: {
                    startedAt: date.getTime(),
                    endsAt: date.getTime(),
                    billingPlatform: "APPLE",
                },
                trial: {
                    activatedAt: date.getTime(),
                    endsAt: date.getTime(),
                },
                cancellation: {
                    initiatedAt: date.getTime(),
                    accessEndsAt: date.getTime(),
                    processedAt: date.getTime(),
                    reasonCode: "USER_CANCELED",
                }
            }
        }

        const model = CactusMember.fromMemberData(json);

        expect(model.createdAt).toEqual(date);
        expect(model.updatedAt).toEqual(date);
        expect(model.deletedAt).toEqual(date);
        expect(model.subscription?.optOutTrial?.billingPlatform).toEqual(BillingPlatform.APPLE)
        expect(model.subscription?.optOutTrial?.startedAt).toEqual(date)
        expect(model.subscription?.optOutTrial?.endsAt).toEqual(date)
        expect(model.subscription?.trial?.endsAt).toEqual(date)
        expect(model.subscription?.trial?.activatedAt).toEqual(date)
        expect(model.activityStatus?.lastSeenOccurredAt).toEqual(date);
        expect(model.subscription?.cancellation?.initiatedAt).toEqual(date)
        expect(model.subscription?.cancellation?.accessEndsAt).toEqual(date)
        expect(model.subscription?.cancellation?.processedAt).toEqual(date)
        expect(model.subscription?.cancellation?.reasonCode).toEqual(CancellationReasonCode.USER_CANCELED);
        expect(model.unsubscribedAt).toEqual(date);
        expect(model.signupAt).toEqual(date);
        expect(model.signupConfirmedAt).toEqual(date);
        expect(model.lastSyncedAt).toEqual(date);
        expect(model.lastReplyAt).toEqual(date);
        expect(model.lastJournalEntryAt).toEqual(date);
        expect(model.adminEmailUnsubscribedAt).toEqual(date);
        expect(model.id).toEqual("one");
    })
})

describe("current offer encoding/decoding", () => {

    test("encode currentOffer to firestore data ", () => {
        const currentOffer = new OfferDetails({ entryId: "e123", appliedAt: new Date(1594353524418) })
        const member = new CactusMember();
        member.id = "123";
        member.currentOffer = currentOffer;
        const data = member.toFirestoreData();
        logger.info("data", data);
        expect(data.currentOffer.appliedAt).toBeDefined();
        expect((data.currentOffer.appliedAt as TimestampInterface).seconds).toBeDefined()
        expect((data.currentOffer.appliedAt as TimestampInterface).nanoseconds).toBeDefined()

        expect(data.currentOffer).not.toBeInstanceOf(OfferDetails);
    })

    test("decode currentOffer to firestore data ", () => {
        const memberData: any = {
            id: "123",
            currentOffer: {
                appliedAt: Timestamp.fromMillis(1594353524418),
                entryId: "e123",
            }
        }

        const member = fromFirestoreData(memberData, CactusMember);
        expect(member.id).toEqual("123");
        expect(member.currentOffer).toBeDefined();
        expect(member.currentOffer!.entryId).toEqual("e123")
        expect(member.currentOffer!.appliedAt!.getTime()).toEqual(1594353524418);
        expect(member.currentOffer).toBeInstanceOf(OfferDetails);

    })
})