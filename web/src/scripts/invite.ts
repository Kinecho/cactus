import {Config} from "@web/config";
import {Endpoint, request} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";
import {InviteResult} from "@shared/types/SocialInviteTypes";

export async function sendInvite(contact: EmailContact): Promise<InviteResult> {
  const options = {
    to_email: contact.email
  }

  try {
    return await request.post(Endpoint.sendInvite, options);
  } catch (e) {
    return {
      data: {
        success: false,
      },
      email: options.to_email,
      message: "Failed to send invitation",
      error: e
    }
  }
}