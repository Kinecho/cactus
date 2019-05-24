
export default class SubscriptionRequest {
    email: String;
    firstName?: String;
    lastName?: String;
    referredByEmail?: String;

    constructor(email: String, ){
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
        let {email, referredByEmail, firstName, lastName} = data;


        let subscription = new SubscriptionRequest(email);
        subscription.referredByEmail = referredByEmail;
        subscription.firstName = firstName;
        subscription.lastName = lastName;

        return subscription
    }
}