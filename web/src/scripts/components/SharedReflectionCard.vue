<template>
    <div class="shared-reflection-card">
        <div class="profile">
            <div class="avatar">
                <img :src="avatarUrl" alt="User Avatar" />
            </div>
            <div class="info">
                <p class="name" v-if="memberName">{{memberName}}</p>
                <p class="email" v-if="!memberName">{{memberEmail}}</p>
                <p class="date">{{shareDate}}</p>
            </div>
        </div>
        <div class="note">
            <h3 class="noteQuestion">{{preventOrphan(response.promptQuestion)}}</h3>
            <p class="note-text">{{preventOrphan(response.content.text)}}</p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import {getRandomAvatar} from '@web/AvatarUtil'
    import MemberProfile from "@shared/models/MemberProfile";
    import MemberProfileService from '@web/services/MemberProfileService';
    import {preventOrphanedWords} from "@shared/util/StringUtil"

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        async beforeMount() {
            if (!this.fetchedProfile && this.response?.cactusMemberId) {
                this.fetchedProfile = await MemberProfileService.sharedInstance.getByMemberId(this.response.cactusMemberId);
            }
        },
        props: {
            response: Object as () => ReflectionResponse,
            memberProfile: Object as () => MemberProfile
        },
        data(): {
            resizeListener: any | undefined,
            deviceWidth: number,
            fetchedProfile: MemberProfile | undefined
        } {
            return {
                resizeListener: undefined,
                deviceWidth: 0,
                fetchedProfile: this.memberProfile
            }
        },
        destroyed() {
            if (this.resizeListener) {
                window.removeEventListener("resize", this.resizeListener);
            }
        },
        mounted() {
            this.deviceWidth = getDeviceDimensions().width;
            this.resizeListener = window.addEventListener("resize", () => {
                this.deviceWidth = getDeviceDimensions().width;
            });
        },
        computed: {
            memberName(): string | undefined {
                if (this.fetchedProfile) {
                    return this.fetchedProfile.getFullName();
                }
            },
            memberEmail(): string | undefined {
                if (this.fetchedProfile?.email) {
                    return this.fetchedProfile.email;
                } else {
                    return this.response.memberEmail;
                }
            },
            shareDate(): string | undefined {
                const format = this.deviceWidth > MOBILE_BREAKPOINT_PX ? copy.settings.dates.longFormat : copy.settings.dates.shortFormat;
                return this.response && this.response.sharedAt && `Shared on ${formatDate(this.response.sharedAt, format)}` || undefined;
            },
            avatarUrl(): string {
                return this.fetchedProfile?.avatarUrl || getRandomAvatar(this.response.memberEmail);
            }
        },
        methods: {
            preventOrphan(input?: string): string|undefined {
                return preventOrphanedWords(input)
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .shared-reflection-card {
        @include shadowbox;
        color: $darkestGreen;
        margin-bottom: 3.2rem;
        padding: 1.6rem 2.4rem;
        text-align: left;

        @include r(374) {
            margin: 0 .8rem 3.2rem;
        }

        @include r(600) {
            margin: 0 auto 4.8rem;
            max-width: 64rem;
            padding: 2.4rem 3.2rem;
        }

        .noteQuestion {
            margin-bottom: .8rem;
        }

        .note-text {
            max-height: 12.4rem;
            overflow: hidden;
            position: relative;
            white-space: pre-line;

            &:after {
                background: linear-gradient(rgba(255,255,255,0), $white);
                content: '';
                display: block;
                height: 4.8rem;
                left: 0;
                position: absolute;
                top: 7.6rem;
                width: 100%;
            }
        }

        &.full .note-text {
            max-height: none;

            &:after {
                display: none;
            }
        }

        .profile {
            align-items: center;
            display: flex;
            margin-bottom: 1.6rem;

            .avatar {
                $avatarDiameter: 4.4rem;
                border-radius: 50%;
                height: $avatarDiameter;
                margin-right: .8rem;
                width: $avatarDiameter;

                img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                }
            }

            .info {
                font-size: 1.4rem;
            }

            .name {
                font-weight: bold;
            }
        }
    }

</style>
