import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {getConfig} from "@api/config/configService";
import SubscriptionResult from "@shared/mailchimp/models/SubscriptionResult";
// import axios from "axios";
import ListMember, {MergeField} from "@api/mailchimp/models/ListMember"


const config = getConfig();
const api_key = config.mailchimp.api_key;
const audienceId = config.mailchimp.audience_id;
const datacenter = getDataCenterFromApiKey();
const mailchimpDomain = `https://${datacenter}.api.mailchimp.com/3.0`;


function getDataCenterFromApiKey():string{
    const split = api_key.split("-");
    return split[split.length - 1] || "";
}

function getListURL():String{
    return `${mailchimpDomain}/lists/${audienceId}`;
}

export async function signup(subscription: SubscriptionRequest): Promise<SubscriptionResult> {
    let url = getListURL();
    console.log("mailchimp url is", url);


    let member = new ListMember(subscription.email);
    if (subscription.referredByEmail){
        member.addMergeField(MergeField.REF_EMAIL, subscription.referredByEmail);
    }

    console.log("created member", JSON.stringify(member, null, 2));

    let result = new SubscriptionResult();
    result.success = false;
    return Promise.resolve(result);
}