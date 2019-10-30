export enum EmailService {
  gmail = "Gmail",
  yahoo = "Yahoo! Mail"
}

export interface EmailAddress {
  address: string
}

export interface CloudspongeContact {
  first_name: string,
  last_name: string,
  email: Array<EmailAddress>
}

export interface EmailContact {
  first_name: string,
  last_name:string,
  email: string
}