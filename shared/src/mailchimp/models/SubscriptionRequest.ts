
export interface SubscriptionFormLocation {
    page: string,
    formId: string,
}

export default class SubscriptionRequest {
    email: string;
    firstName?: string;
    lastName?: string;
    referredByEmail?: string;
    subscriptionLocation?: SubscriptionFormLocation;

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


    static fromData(body: any): SubscriptionRequest{
        const data = body.data || body || {};
        return data as SubscriptionRequest;
    }
}