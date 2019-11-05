import {QueryParam} from '@shared/util/queryParams'
import {appendQueryParams} from '@shared/util/StringUtil'
import CactusMember from "@shared/models/CactusMember";

export interface ReferralLinkParams {
  member: CactusMember | undefined,
  utm_source: string,
  utm_medium: string,
  domain?: string,
  social_invite_id?: string
}

export function generateReferralLink(options: ReferralLinkParams): string {
    const { member, utm_source, utm_medium, domain, social_invite_id } = options;
    const url = domain ? domain : 'cactus.app';
    const params: { [key: string]: string } = {
        [QueryParam.UTM_SOURCE]: utm_source,
        [QueryParam.UTM_MEDIUM]: utm_medium
    };
    if (social_invite_id) {
      params[QueryParam.SOCIAL_INVITE_ID] = social_invite_id;
    }

    if (member && member.email) {
        params[QueryParam.REFERRED_BY_EMAIL] = member.email;
    }

    return appendQueryParams(url, params);
}