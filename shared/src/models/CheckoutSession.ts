import {BaseModel, Collection} from "@shared/FirestoreBaseModels";
import { OfferDetails } from "@shared/models/PromotionalOffer";


export interface StripeCheckoutSession {
    sessionId: string,
    planId?: string,
    customerId?: string,
    /**
     * The amount to charge, in cents USD
     */
    amount?: number | null,
    raw?: any,
}

enum Fields {
    stripeSessionId = "stripe.sessionId",
    memberId = "memberId",

}

/**
 * An object that represents a Checkout session that may or may not have completed a purchase.
 * This allows us to link up past sessions with members that complete purchases later.
 */
export default class CheckoutSession extends BaseModel {
    static Fields = Fields;
    collection = Collection.checkoutSessions;
    memberId!: string;
    memberEmail?: string;
    stripe?: StripeCheckoutSession;
    promotionalOfferEntryId?: string;

    static stripe(args: {
        memberId: string,
        email?: string,
        sessionId: string,
        planId?: string,
        customerId?: string,
        amount?: number | null,
        offerDetails?: OfferDetails|null,
        raw?: any,
    }): CheckoutSession {
        const session = new CheckoutSession();
        const {memberId, email, sessionId, planId, customerId, amount, raw, offerDetails} = args;
        session.memberId = memberId;
        session.memberEmail = email;
        session.stripe = {sessionId, planId, customerId, amount, raw};
        session.promotionalOfferEntryId = offerDetails?.entryId;
        return session;
    }
}