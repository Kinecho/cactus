import {QueryParam} from '@shared/util/queryParams'
<template>
    <div class="wrapper">
        <NavBar/>
        <div class="centered">
            <div v-if="error">
                <h2>Sorry, we were unable to process your request.</h2>
                <p>{{serverMessage}}</p>
                You can always manage your notification preferences in your <a :href="accountPath">settings</a>.
            </div>
            <div class="leftAlign" v-else-if="!unsubscribeSuccess">
                <h2>Unsubscribe</h2>
                <p>Are you sure you want to unsubscribe {{email}} from Cactus reflection prompt email notifications?</p>
                <button class="primary" @click="confirmUnsubscribe" :disabled="submitting">Yes, Unsubscribe Me</button>
            </div>
            <div class="leftAlign" v-else-if="unsubscribeSuccess">
                <h2>Notification Settings Updated</h2>
                <div v-if="isSendGrid">
                    <p>
                        Cactus will no longer send you <b v-if="email">({{email}})</b> new account related emails.
                    </p>
                </div>
                <div v-else>
                    <p>
                        Cactus will no longer send you <b v-if="email">({{email}})</b> new reflection prompt emails. You can start receiving them again at any time by adjusting your <a :href="accountPath">settings</a>.
                    </p>
                </div>
                <h3>Interested in Push Notifications instead?</h3>
                <p>Learn about <a :href="appStoreUrl">Cactus for iOS</a>.</p>
                <h3>Have feedback or questions?</h3>
                <p>Email us at <a href="mailto:help@cactus.app">help@cactus.app</a></p>
            </div>
        </div>

    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import {getQueryParam} from '@web/util'
    import {QueryParam} from "@shared/util/queryParams"
    import {PageRoute} from '@shared/PageRoutes'
    import NavBar from "@components/NavBar.vue";
    import {confirmUnsubscribe} from '@web/mailchimp'
    import {AxiosError} from "axios"
    import {UnsubscribeResponse} from '@shared/mailchimp/models/UpdateStatusTypes'
    import {Config} from "@web/config";
    import Logger from "@shared/Logger";

    const logger = new Logger("UnsubscribeConfirmedPage.vue");
    export default Vue.extend({
        components: {
            NavBar,
        },
        created() {

        },
        beforeMount() {
            this.email = getQueryParam(QueryParam.EMAIL);
            this.serverMessage = getQueryParam(QueryParam.MESSAGE);
            this.mailchimpUniqueEmailId = getQueryParam(QueryParam.MAILCHIMP_EMAIL_ID);
            if (getQueryParam(QueryParam.ALREADY_UNSUBSCRIBED) === "true") {
                this.unsubscribeSuccess = true;
            }
            // let unsubSuccess = getQueryParam(QueryParam.UNSUBSCRIBE_SUCCESS) === "true"
            if (getQueryParam(QueryParam.UNSUBSCRIBE_SUCCESS) === "false") {
                this.error = true;
            }
            if (getQueryParam(QueryParam.SEND_GRID) === "yes") {
                this.isSendGrid = true;
            }

        },
        props: {},
        data(): {
            email: string | null,
            mailchimpUniqueEmailId: string | null,
            serverMessage: string | null,
            unsubscribeSuccess: boolean,
            accountPath: string,
            error: boolean,
            submitting: boolean,
            isSendGrid: boolean
        } {
            return {
                email: null,
                mailchimpUniqueEmailId: null,
                serverMessage: null,
                unsubscribeSuccess: false,
                accountPath: PageRoute.ACCOUNT,
                error: false,
                submitting: false,
                isSendGrid: false
            }
        },
        methods: {
            async confirmUnsubscribe() {

                let email = this.email;
                let mcuid = this.mailchimpUniqueEmailId;
                if (!email || !mcuid) {
                    this.error = true;
                    this.serverMessage = null;
                    return;
                }

                this.submitting = true;

                try {
                    let response = await confirmUnsubscribe({email: email, mcuid: mcuid});
                    logger.log("Unsubscribe response", response);
                    this.submitting = false;
                    this.unsubscribeSuccess = response.success;
                    this.error = false;
                    this.serverMessage = null;
                } catch (error) {
                    this.submitting = false;
                    this.unsubscribeSuccess = false;
                    this.error = error = true;
                    if (error.isAxiosError) {
                        let axiosError = error as AxiosError;
                        let errorBody = axiosError.response?.data as UnsubscribeResponse;
                        this.serverMessage = errorBody?.error || null
                    }
                }
            }
        },
        computed: {
            appStoreUrl() {
                return Config.appStoreUrl;
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .wrapper {
        min-height: 100vh;

        .centered {
            margin: 3.2rem;

            @include r(768) {
                margin: 6.4rem auto;
                max-width: 60rem;
            }
        }

        .leftAlign {
            text-align: left;
        }

        h2 {
            line-height: 1.1;
            margin-bottom: .8rem;
        }

        h3 {
            margin-bottom: .4rem;
        }

        p {
            margin: 0 0 3.2rem;
        }
    }

</style>
