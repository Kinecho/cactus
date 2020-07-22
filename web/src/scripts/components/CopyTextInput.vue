<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="copy-link-container">
        <input type="text" class="link-input" name="referral-link" :disabled="!editable" :value="formattedText">
        <button class="copy btn" :class="[buttonStyle]"
                v-clipboard:copy="formattedText"
                v-clipboard:success="handleCopySuccess"
                v-clipboard:error="handleCopyError">
            <span v-if="copySucceeded === true">Copied</span>
            <span v-if="copySucceeded === false">Copy Link</span>
        </button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {appendQueryParams} from '@shared/util/StringUtil'
    import Logger from "@shared/Logger";

    const logger = new Logger("CopyTextInput.vue");


    export default Vue.extend({
        created() {

        },
        props: {
            text: String,
            editable: {type: Boolean, default: false},
            queryParams: {type: Object as () => { [key: string]: string }},
            buttonStyle: {validator: (value: string) => ["primary", "secondary"].includes(value), default: "secondary"},
        },
        data(): {
            copySucceeded: boolean,
            error: any | undefined,
        } {
            return {
                copySucceeded: false,
                error: undefined
            }
        },
        computed: {
            formattedText(): string {
                if (this.queryParams && Object.keys(this.queryParams).length > 0) {
                    try {
                        return appendQueryParams(this.text, this.queryParams);
                    } catch (e) {
                        logger.error(`Unable to append query params to text "${this.text}"`);
                        return this.text;
                    }
                }

                return this.text;
            }
        },
        methods: {
            handleCopyError() {
                alert("Copied Failed");
            },
            handleCopySuccess() {
                this.copySucceeded = true;
                setTimeout(() => this.copySucceeded = false, 2000);
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .link-input {
        @include textInput;
        background-color: $white;
        color: $lightText;
        margin-bottom: .8rem;
        max-width: none;
        width: 100%;

        @include r(374) {
            margin-bottom: 0;
        }
        @include r(600) {
            max-width: none;
        }
    }

    .copy-link-container {
        position: relative;
    }

    button.copy {
        min-width: 11rem;
        width: 100%;

        @include r(374) {
            box-shadow: none;
            height: 4.7rem;
            padding: 1.2rem 2.4rem;
            position: absolute;
            right: 0;
            top: 0;
            width: auto;
        }

        &:active {
            background-color: $darkGreen;
            color: $white;
        }

        &.primary {
            @include buttonPrimary;
        }

        &.secondary {
            @include buttonSecondary;
            background-color: $lightGreen;
            color: $darkGreen;
        }
    }

</style>
