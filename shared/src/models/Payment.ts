import {BaseModel, Collection} from "@shared/FirestoreBaseModels";

export default class Payment extends BaseModel {
    collection = Collection.payments;
    amountCentsUsd?: number;
    subscriptionProductId?: string;
    stripe?: StripePayment;

}

interface StripePayment {
    raw: any;
}