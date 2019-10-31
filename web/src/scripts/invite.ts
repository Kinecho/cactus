import {Config} from "@web/config";
import {Endpoint, request} from "@web/requestUtils";
import {EmailContact} from "@shared/types/EmailContactTypes";

export interface InviteResult {
    success: boolean,
    email: string,
    message: string,
    error?: {
        title: string,
        message: string,
        friendlyMessage?: string
    }
}

export async function sendInvite(contact: EmailContact): Promise<InviteResult> {
  const options = {
    to_email: contact.email
  }

  try {
    return await request.post(Endpoint.sendInvite, options);
  } catch (e) {
    return {
      success: false,
      email: options.to_email,
      message: "Failed to send invitation",
      error: e
    }
  }
}