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

    const copy = CopyService.getSharedInstance().copy;


    export default Vue.extend({
        created() {

        },
        props: {
            response: ReflectionResponse
        },
        data(): {} {
            return {}
        },
        computed: {
            memberEmail(): string | undefined {
                return this.response.memberEmail;
            },
            shareDate(): string | undefined {

                return this.response && this.response.sharedAt && `Shared on ${formatDate(this.response.sharedAt, copy.settings.dates.longFormat)}` || undefined;
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
                $avatarDiameter: 5rem;
                background-color: $lightGreen;
                border-radius: 50%;
                width: $avatarDiameter;
                height: $avatarDiameter;
                display: flex;
                justify-content: center;
                align-items: center;
                color: $white;
                margin-right: 1rem;
            }

            .info {
                display: flex;
                flex-direction: column;

                .email {
                    font-weight: bold;
                }
            }
        }

    }

</style>
