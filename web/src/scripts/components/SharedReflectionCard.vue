<template>
    <div class="shared-reflection-card">
        <div class="note">
            <h3 class="noteQuestion">{{response.promptQuestion}}</h3>
            <p class="note-text">{{response.content.text}}</p>
        </div>
        <div class="profile">
            <div class="avatar">
                <flamelink-image :image="avatarData.image" alt="User Avatar"/>
            </div>
            <div class="info">
                <p class="name">{{memberName}}</p>
                <p class="email">{{memberEmail}}</p>
                <p class="date">{{shareDate}}</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import {formatDate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"
    import FlamelinkImage from '@components/FlamelinkImage.vue'
    import {Image} from '@shared/models/PromptContent'
    import {getRandomAvatar} from '@web/AvatarUtil'

    const copy = CopyService.getSharedInstance().copy;


    export default Vue.extend({
        components: {
            FlamelinkImage,
        },
        created() {

        },
        props: {
            response: ReflectionResponse
        },
        data(): {
            resizeListener: any | undefined,
            deviceWidth: number,
        } {
            return {
                resizeListener: undefined,
                deviceWidth: 0,
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
            })
        },
        computed: {
            memberName(): string | undefined {
                if (this.response && this.response.anonymous) {
                    return copy.auth.AN_ANONYMOUS_USER;
                } else if (this.response) {
                    // return "some User but we don't have their profile";
                }
            },
            memberEmail(): string | undefined {
                return this.response.memberEmail;
            },
            shareDate(): string | undefined {
                const format = this.deviceWidth > MOBILE_BREAKPOINT_PX ? copy.settings.dates.longFormat : copy.settings.dates.shortFormat;
                return this.response && this.response.sharedAt && `Shared on ${formatDate(this.response.sharedAt, format)}` || undefined;
            },
            avatarData(): {
                image: any | Image,
            } {
                const image: Image = {
                    url: getRandomAvatar(this.response.memberEmail),
                };

                return {
                    image,
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .shared-reflection-card {
        @include shadowbox;
        margin: -2.4rem 0 2.4rem;
        padding: 1.6rem 2.4rem;
        text-align: left;

        @include r(600) {
            padding: 3.2rem 2.4rem;
        }

        @include r(768) {
            margin: 0 auto 4.8rem;
            max-width: 64rem;
            padding: 3.2rem;
        }

        .noteQuestion {
            margin-bottom: .8rem;
        }

        .note-text {
            margin-bottom: 2.4rem;
            white-space: pre-line;
        }

        .profile {
            display: flex;
            align-items: center;

            .avatar {
                $avatarDiameter: 4.4rem;
                border-radius: 50%;
                height: $avatarDiameter;
                margin-right: .8rem;
                width: $avatarDiameter;

                @include r(600) {
                    $avatarDiameter: 6.4rem;
                    height: $avatarDiameter;
                    width: $avatarDiameter;
                }

                img {
                    width: 100%;
                    height: 100%;
                }
            }

            .info {
                font-size: 1.6rem;
            }

            .name {
                font-weight: bold;
            }
        }
    }

</style>
