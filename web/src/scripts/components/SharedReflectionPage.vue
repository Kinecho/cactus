<template>
    <div class="shared-reflection-page">
        <NavBar :isSticky="false" :forceTransparent="true" :showSignup="true"/>
        <div class="content">
            <div v-if="error" class="error">{{error}}</div>
            <div class="reflection-container" v-if="reflectionResponse">
                <card :response="reflectionResponse"/>

            </div>
            <sign-up-footer/>
        </div>
        <Footer/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from "@web/PageRoutes"
    import NavBar from "@components/NavBar.vue"
    import Footer from "@components/StandardFooter.vue"
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import ReflectionResponse from "@shared/models/ReflectionResponse"
    import Card from "@components/SharedReflectionCard.vue";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import SignUpFooter from "@components/SignUpFooter.vue";

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Card,
            SignUpFooter,
        },
        created() {

        },
        props: {},
        beforeMount() {
            let responseId: string | undefined = undefined;
            try {
                responseId = window.location.pathname.split(`${PageRoute.SHARED_REFLECTION}/`)[1].split("/")[0]
            } catch (error) {
                console.error("Failed to parse path to get reflection id", error);
            }

            if (!responseId) {
                this.error = "Invalid URL";
                return;
            }

            this.reflectionResponseId = responseId;

            this.responseUnsubscriber = ReflectionResponseService.sharedInstance.observeSharedReflection(responseId, {
                onData: (reflectionResponse, error) => {
                    if (error || !reflectionResponse) {
                        this.error = "This reflection does not exist or you do not have permission to view it";
                        this.reflectionResponse = undefined;
                        return;
                    }
                    this.error = undefined;
                    this.reflectionResponse = reflectionResponse;
                }
            })
        },
        beforeDestroy() {
            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }
        },
        data(): {
            reflectionResponseId: string | undefined,
            error: string | undefined,
            responseUnsubscriber: ListenerUnsubscriber | undefined,
            reflectionResponse: ReflectionResponse | undefined,
        } {
            return {
                reflectionResponseId: undefined,
                error: undefined,
                responseUnsubscriber: undefined,
                reflectionResponse: undefined,
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .shared-reflection-page {
        background: url("/assets/images/greenNeedleBlob.svg"), $lightGreen;
        background-size: 40%;
        @include r(600) {
            background: unset;
            background-size: 60%
        }

        min-height: 40rem;

        .content {
            padding: 2rem 0 0;
            @include r(600) {
                padding: 4rem 1rem 0;
            }


            .error {
                padding: 3rem;
                background-color: $lightPink;
                color: $darkestPink;
            }
        }
    }

</style>
