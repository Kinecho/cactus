<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="copy-link-container">
        <input type="text" class="link-input" name="referral-link" :disabled="!editable" :value="formattedText">
        <button class="copy secondary btn"
                v-clipboard:copy="formattedText"
                v-clipboard:success="handleCopySuccess"
                v-clipboard:error="handleCopyError">
            <span v-if="copySucceeded === true">Copied</span>
            <span v-if="copySucceeded === false">Copy</span>
        </button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import VueClipboard from 'vue-clipboard2';
    import {appendQueryParams} from '@shared/util/StringUtil'

    Vue.use(VueClipboard);

    export default Vue.extend({
        created() {

        },
        props: {
            text: String,
            editable: {type: Boolean, default: false},
            queryParams: {type: Object as () => { [key: string]: string }}
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
                        console.error(`Unable to append query params to text "${this.text}"`);
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

    .copy-link-container {
        margin-bottom: 3.2rem;
        position: relative;

        .link-input {
            @include textInput;
            color: $lightText;
            margin-bottom: .8rem;
            max-width: none;
            width: 100%;

            @include r(600) {
                margin-bottom: 1.6rem;
                padding-right: 9rem;
            }
        }

        button.copy {
            background-color: $lightGreen;
            width: 100%;
            margin-bottom: 1.2rem;

            @include r(600) {
                background-color: transparent;
                border: none;
                box-shadow: none;
                padding: 1.2rem 2.4rem;
                position: absolute;
                right: 0;
                top: 0;
                width: auto;

                &:hover {
                    background: transparent;
                }

                &:active {
                    background-color: $darkGreen;
                    color: $white;
                }
            }
        }
    }

</style>
