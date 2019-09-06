<template>
    <div class="shared-reflection-card">
        <div class="note">
            <h3 class="noteQuestion">{{response.promptQuestion}}</h3>
            <p class="note-text">{{response.content.text}}</p>
        </div>
        <div class="profile">
            <div class="avatar">NP</div>
            <div class="info">
                <span class="email">{{memberEmail}}</span>
                <span class="name">{{memberName}}</span>
                <span class="date">{{shareDate}}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import {formatDate, getISODate} from '@shared/util/DateUtil'
    import CopyService from "@shared/copy/CopyService"
    import {getDeviceDimensions, MOBILE_BREAKPOINT_PX} from "@web/DeviceUtil"

    const copy = CopyService.getSharedInstance().copy;


    export default Vue.extend({
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
                    return "some User but we don't have their profile";
                }
            },
            memberEmail(): string | undefined {
                return this.response.memberEmail;
            },
            shareDate(): string | undefined {
                const format = this.deviceWidth > MOBILE_BREAKPOINT_PX ? copy.settings.dates.longFormat : copy.settings.dates.shortFormat;
                return this.response && this.response.sharedAt && `Shared on ${formatDate(this.response.sharedAt, format)}` || undefined;
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
        margin: 0 1.6rem 3.2rem;
        overflow: hidden;
        padding: 1.6rem 1.6rem 2.4rem;
        position: relative;
        text-align: left;

        @include r(600) {
            padding: 3.2rem 2.4rem;
        }

        @include r(768) {
            margin: 0 auto 4.8rem;
            max-width: 64rem;
            padding: 3.2rem;
        }


        .note {
            margin-bottom: 1rem;

            .note-text {
                white-space: pre-line;
            }
        }

        .profile {
            display: flex;
            align-items: center;

            .avatar {
                flex-shrink: 0;
                $avatarDiameter: 4rem;
                font-size: 1.5rem;
                background-color: $lightGreen;
                border-radius: 50%;
                width: $avatarDiameter;
                height: $avatarDiameter;
                display: flex;
                justify-content: center;
                align-items: center;
                color: $white;
                margin-right: 1rem;

                @include r(600) {
                    $avatarDiameter: 5rem;
                    width: $avatarDiameter;
                    height: $avatarDiameter;
                    font-size: 2.4rem;
                }
            }

            .info {
                display: flex;
                flex-direction: column;

                .email, .name {
                    font-weight: bold;
                }

            }
        }

    }

</style>
