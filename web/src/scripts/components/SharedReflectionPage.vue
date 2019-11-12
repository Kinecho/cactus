<template>
    <div class="shared-reflection-page">
        <NavBar :isSticky="false" :forceTransparent="true" :showSignup="true"/>
        <div class="content">
            <div v-if="error" class="error">{{error}}</div>
            <div class="reflection-container" v-if="reflectionResponse">
                <card :response="reflectionResponse" class="full" />

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
    import CopyService from "@shared/copy/CopyService"
    import Card from "@components/SharedReflectionCard.vue";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'
    import SignUpFooter from "@components/SignUpFooter.vue";
    import {formatDate} from '@shared/util/DateUtil'

    const copy = CopyService.getSharedInstance().copy;

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
                    this.updateDocumentMeta();
                }
            })
        },
        beforeDestroy() {
            if (this.responseUnsubscriber) {
                this.responseUnsubscriber();
            }
        },
        methods: {
            updateDocumentMeta() {
                let ogTitleTag = document.querySelector("meta[property='og:title']");
                let twitterTitleTag = document.querySelector("meta[name='twitter:title']");
                let ogDescriptionTag = document.querySelector("meta[property='og:description']");
                let twitterDescriptionTag = document.querySelector("meta[name='twitter:description']");

                if (this.reflectionResponse) {
                    let identifier = this.reflectionResponse.getMemberFullName() || this.reflectionResponse.memberEmail;
                    let question = this.reflectionResponse.promptQuestion;
                    let shareDate = formatDate(this.reflectionResponse.sharedAt, copy.settings.dates.longFormat);

                    if (question) { question = question.trim(); }
                    
                    let title = `Read ${identifier}'s private note on '${question}'`;
                    let description = `This reflection note was shared on ${shareDate}.`;

                    if (ogTitleTag && ogDescriptionTag) {
                        document.title = title
                        ogTitleTag.setAttribute("content", `${title}`);
                        ogDescriptionTag.setAttribute("content", `${description}`);

                        if (twitterTitleTag && twitterDescriptionTag) {
                            twitterTitleTag.setAttribute("content", `${title}`);
                            twitterDescriptionTag.setAttribute("content", `${description}`); 
                        }
                    }
                }
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
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100vh;
    }

    header {
        width: 100%;
    }

    .content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .reflection-container {
        flex-grow: 1;
        padding: 2.4rem;
    }

    .error {
        background-color: $lightPink;
        color: $darkestPink;
        margin: 2.4rem auto;
        max-width: 64rem;
        padding: 2.4rem;
        width: 100%;

        @include r(768) {
          border-radius: 6px;
        }
    }

</style>
