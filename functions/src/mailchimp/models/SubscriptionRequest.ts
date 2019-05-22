import {Request} from "express"

export default class SubscriptionRequest {
    email: String;
    firstName?: String;
    lastName?: String;
    referredByEmail?: String;

    constructor(email: String, firstName: String, lastName: String, referredByEmail: String){
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.referredByEmail = referredByEmail;
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


    static fromRequest(request: Request): SubscriptionRequest{
        const data = request.body.data || request.body;
        return new SubscriptionRequest(data.email, data.firstName, data.lastName, data.referredByEmail);
    }
}