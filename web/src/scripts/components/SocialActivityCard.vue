<template>
    <div class="activityCard">
        <div class="avatar" v-if="avatarURL">
            <img :src="avatarURL" alt="User avatar" />
        </div>
        <div class="info">
            <p class="date" v-if="date">{{date}}</p>
            <p class="description"><span class="bold">{{name}}</span> reflected on
                <router-link :to="promptContentPath" v-if="promptContentPath">{{promptQuestion}}</router-link>
                <span class="bold" v-if="!promptContentPath">{{promptQuestion}}</span>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {getIntegerFromStringBetween} from '@shared/util/StringUtil';

    export default Vue.extend({
        props: {
            avatarUrl: { type: String },
            date: { type: String, required: true },
            name: { type: String, required: true },
            promptContentPath: { type: String },
            promptQuestion: {type: String, required: true }
        },
        computed: {
            avatarURL(): string {
                if (this.avatarUrl) {
                    return this.avatarUrl
                }
                return `/assets/images/avatars/avatar${this.avatarNumber(this.name)}.png`
            },
            
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
