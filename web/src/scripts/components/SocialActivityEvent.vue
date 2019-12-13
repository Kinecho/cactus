<template>
    <div class="activityCard">
        <div class="avatar" v-if="avatarURL">
            <img :src="avatarURL" alt="User avatar" />
        </div>
        <div class="info">
            <p class="date" v-if="occurredDate">{{occurredDate}}</p>
            <p class="description"><span class="bold">{{memberName || memberEmail}}</span> reflected on
                <a :href="promptContentPath" v-if="promptContentPath">{{promptQuestion}}</a>
                <span class="bold" v-if="!promptContentPath">{{promptQuestion}}</span>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import MemberProfile from "@shared/models/MemberProfile";
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';
    import MemberProfileService from '@web/services/MemberProfileService';
    import {SocialActivityFeedEvent} from "@shared/types/SocialTypes";
    import {PageRoute} from "@shared/PageRoutes";
    import {formatAsTimeAgo} from "@shared/util/DateUtil";
    import {QueryParam} from "@shared/util/queryParams";

    export default Vue.extend({
        props: {
            event: {
                type: Object as () => SocialActivityFeedEvent,
                required: true
            },
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
                if (this.memberProfile?.getFullName()) {
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

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .activityCard {
        border-bottom: 1px solid $lightestGreen;
        display: flex;
        font-size: 1.6rem;
        margin: 0 -2.4rem;
        padding: 1.6rem;
        text-align: left;

        @include r(374) {
            background-color: white;
            border: 0;
            border-radius: 12px;
            box-shadow: 0 5px 11px -3px rgba(0, 0, 0, 0.08);
            margin: 0 -1.6rem .4rem;
        }

        @include r(600) {
            font-size: 1.8rem;
            margin: 0 0 3.2rem;
            max-width: 64rem;
            padding: 2.4rem;

            &.demo {
                max-width: 48rem;
            }
        }

        a {
            text-decoration: none;

            &:hover {
                color: $darkestGreen;
            }
        }

        .bold {
            font-weight: bold;
        }
    }

    .email,
    .date {
        font-size: 1.4rem;
        opacity: .8;
    }

    .avatar {
        $avatarDiameter: 6.4rem;
        border-radius: 50%;
        flex-shrink: 0;
        height: $avatarDiameter;
        margin-right: 1.6rem;
        overflow: hidden;
        width: $avatarDiameter;

        img {
            width: 100%;
            height: 100%;
        }
    }

    .info button {
        margin-top: 1.6rem;
    }

</style>
