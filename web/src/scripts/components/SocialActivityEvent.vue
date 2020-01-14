<template>
    <div class="activityEvent">
        <SocialActivityCard
            :avatarUrl="avatarURL"
            :date="occurredDate"
            :name="memberName || memberEmail"
            :promptContentPath="promptContentPath" 
            :promptQuestion="promptQuestion" />
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MemberProfile from "@shared/models/MemberProfile";
    import CactusMember from "@shared/models/CactusMember";
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import MemberProfileService from '@web/services/MemberProfileService';
    import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";
    import {PageRoute} from "@shared/PageRoutes";
    import {formatAsTimeAgo} from "@shared/util/DateUtil";
    import {QueryParam} from "@shared/util/queryParams";
    import CopyService from '@shared/copy/CopyService';
    import {titleCase} from "@shared/util/StringUtil";
    import SocialActivityCard from "@components/SocialActivityCard.vue"

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            SocialActivityCard,
        },
        props: {
            event: {
                type: Object as () => SocialActivityFeedEvent,
                required: true
            },
            viewer: {
                type: Object as () => CactusMember,
                required: true
            }
        },
        async created() {
            if (this.event?.memberId) {
                this.memberProfile = await MemberProfileService.sharedInstance.getByMemberId(this.event.memberId);
            }
        },
        data(): {
            memberProfile: MemberProfile | undefined
        } {
            return {
                memberProfile: undefined
            }
        },
        computed: {
            memberName(): string|undefined {
                if (this.memberProfile?.cactusMemberId == this.viewer.id) {
                    return titleCase(copy.pronouns.YOU);
                } else if (this.memberProfile?.getFullName()) {
                    return this.memberProfile.getFullName();
                }
            },
            memberEmail(): string {
                return this.memberProfile?.email || '';
            },
            avatarURL(): string {
                if (this.memberProfile?.avatarUrl) {
                    return this.memberProfile.avatarUrl
                }
                return `/assets/images/avatars/avatar${this.avatarNumber(this.memberEmail)}.png`
            },
            promptQuestion(): string {
                if (this.event?.payload?.promptQuestion) {
                    return this.event.payload.promptQuestion;
                }
                return 'a question';
            },
            promptContentPath(): string | undefined {
                if (this.promptId) {
                    return `${PageRoute.PROMPTS_ROOT}/${this.promptId}?${QueryParam.USE_PROMPT_ID}=true`
                }
                return undefined;
            },
            promptId(): string | undefined {
                if (this.event?.payload?.promptId) {
                    return this.event.payload.promptId;
                }
                return undefined;
            },
            occurredDate(): string | undefined {
                if (this.event?.occurredAt) {
                    return formatAsTimeAgo(new Date(this.event.occurredAt));
                }
                return undefined;
            },
            viewerId(): string {
                return this.viewer?.id ? this.viewer.id : '';
            }
        },
        watch: {

        },
        methods: {
            avatarNumber(email: string): number {
                return getIntegerFromStringBetween(email, 4) + 1;
            }
        }
    })
</script>
