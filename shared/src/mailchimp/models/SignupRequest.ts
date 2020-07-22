import {SubscriptionTier} from "@shared/models/SubscriptionProductGroup";

export interface SubscriptionFormLocation {
    page: string,
    formId: string,
}

export default class SignupRequest {
    email: string;
    firstName?: string;
    lastName?: string;
    referredByEmail?: string;
    subscriptionLocation?: SubscriptionFormLocation;
    subscriptionTier?: SubscriptionTier;
    constructor(email: string,){
        this.email = email;
    }

    getEmail(){
        return this.email
    }

    getFirstName(){
        return this.lastName;
    }

    getLastName(){
        return this.lastName;
    }

    getReferredByEmail(){
        return this.referredByEmail;
    }


    static fromData(body: any): SignupRequest{
        const data = body.data || body || {};
        return data as SignupRequest;
    }
}