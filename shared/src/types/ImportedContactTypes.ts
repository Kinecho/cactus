import {EmailContact} from "@shared/types/EmailContactTypes";

export interface ContactStatus {
  isMember: boolean,
  isFriend: boolean,
  isRequested: boolean
}

export interface ImportedContact {
  email_contact: EmailContact,
  statuses: ContactStatus
  memberId: string | undefined,
  avatarUrl: string | undefined,
}