import {Config} from "@web/config";
import {Endpoint, request, getAuthHeaders} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {InviteResult, SocialInviteRequest} from "@shared/types/SocialInviteTypes";
import {getAuth} from "@web/firebase";

export async function sendInvite(contact: EmailContact, message: string): Promise<InviteResult> {
  const currentUser = getAuth().currentUser;

  if (!currentUser) { 
    return {
      data: {
        success: false,
      },
      email: contact.email,
      message: "Current user is not authenticated."
    }
  } else {
    console.log(currentUser);
    const requestOptions: SocialInviteRequest = {
      toContact: contact,
      message: message
    }

    try {
      const headers = await getAuthHeaders();
      return await request.post(Endpoint.sendInvite, requestOptions, {headers});
    } catch (e) {
      return {
        data: {
          success: false,
        },
        email: requestOptions.toContact.email,
        message: "Failed to send invitation",
        error: e
      }
    }
  }
}