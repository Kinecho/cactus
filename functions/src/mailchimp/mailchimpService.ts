import SubscriptionRequest from "@shared/mailchimp/models/SubscriptionRequest";
import {getConfig} from "@api/config/configService";
import SubscriptionResult, {SubscriptionResultStatus} from "@shared/mailchimp/models/SubscriptionResult";
import axios, {AxiosError} from "axios";
import ListMember, {
    ListMemberStatus,
    MergeField,
    MergeFields, Tag
} from "@shared/mailchimp/models/ListMember"
import ApiError from "@shared/ApiError";
import * as md5 from "md5";


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
    const member = new ListMember(subscription.email);
    member.status = ListMemberStatus.pending;

    if (subscription.referredByEmail){
        member.addMergeField(MergeField.REF_EMAIL, subscription.referredByEmail);
    }

    console.log("created member", JSON.stringify(member, null, 2));

    const result = new SubscriptionResult();
    result.member = member;

    try {
        const response = await axios.post(
            `${getListURL()}/members/`,
            member,
            {auth: {username: `cactus`, password: api_key}}
        );
        console.log("mailchimp response", response.data);
        result.success = true;
        result.status = SubscriptionResultStatus.new_subscriber;
    } catch (error){
        const apiError = new ApiError();
        if (error && error.response && error.response.data){
            const data = error.response.data;

            switch (data.title) {
                case "Member Exists":
                    console.warn("User is already on list. Treating as a successful signup", data)
                    result.success = true;
                    result.status = SubscriptionResultStatus.existing_subscriber;
                    break;
                case "Invalid Resource":
                    console.warn("unable to sign up user", data);
                    result.success = false;
                    result.status = SubscriptionResultStatus.unknown;
                    apiError.friendlyMessage = data.detail || "Please provide a valid email address.";
                    apiError.code = data.status;
                    apiError.error = error.response.data;
                    break;
                default:
                    console.error("failed to create new member. Response data", data);
                    apiError.friendlyMessage = "Oops, we're unable to sign you up right now. Please try again later.";
                    apiError.error = error.response.data;
                    apiError.code = data.status;
                    result.success = false;
                    result.status = SubscriptionResultStatus.unknown;
                    break;
            }

        }
        else {
            console.error("Failed to update mailchimp list", error);
            apiError.code = 500;
            apiError.error = error;
            apiError.friendlyMessage = "An unexpected error occurred. Please try again later";
            result.success = false;
        }
        result.error = apiError;
    }

    return result;
}

export interface UpdateMergeFieldRequest {
    email: string,
    mergeFields: MergeFields
}

export interface UpdateTagsRequest {
    email: string,
    tags: Tag[]
}

/**
 * Get the hashed version of the user's email, which is used as the id for the mailchip amp
 * see: https://developer.mailchimp.com/documentation/mailchimp/guides/manage-subscribers-with-the-mailchimp-api/
 * @param {string} email
 * @return {string}
 */
export function getMemberIdFromEmail(email:string):string {
    const hashed = md5(email.toLowerCase().trim());
    return hashed;
}

export async function updateMergeFields(request: UpdateMergeFieldRequest){
    try {
        const memberPatch = {merge_fields: request.mergeFields};
        const memberId = getMemberIdFromEmail(request.email);

        console.log("Updating member with patch", memberPatch);
        const response = await axios.patch(
            `${getListURL()}/members/${memberId}`,
            memberPatch,
            {auth: {username: `cactus`, password: api_key}}
        );

        console.log("update merge field response", response.data);

        return true;
    } catch (error){
        console.error("error updating member", error);
        const axiosError = error as AxiosError;
        console.log("error updating member: code", axiosError.code);

        if (axiosError.response && axiosError.response.data){
            const data = axiosError.response.data;
            console.log("error data:", JSON.stringify(data));
        }
        return false
    }
}

export async function updateTags(request: UpdateTagsRequest){
    try {
        const memberPatch = {tags: request.tags};
        const memberId = getMemberIdFromEmail(request.email);

        console.log("Updating member with patch", memberPatch);
        const response = await axios.post(
            `${getListURL()}/members/${memberId}/tags`,
            memberPatch,
            {auth: {username: `cactus`, password: api_key}}
        );

        console.log("update tags response", response.data);

        return true;
    } catch (error){
        console.error("error updating tags", error);
        const axiosError = error as AxiosError;
        console.log("error updating member: code", axiosError.code);

        if (axiosError.response && axiosError.response.data){
            const data = axiosError.response.data;
            console.log("error data:", JSON.stringify(data));
        }
        return false
    }
}