<template>
    <div class="shared-reflection-page">
        <NavBar :isSticky="false"/>
        <div class="content">
            <div v-if="error" class="error">{{error}}</div>
            <div class="reflection-container" v-if="reflectionResponse">
                <card :response="reflectionResponse"/>

            </div>
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

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Card,
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

            ReflectionResponseService.sharedInstance.observeSharedReflection(responseId, {
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
        data(): {
            reflectionResponseId: string | undefined,
            error: string | undefined,
            reflectionResponse: ReflectionResponse | undefined,
        } {
            return {
                reflectionResponseId: undefined,
                error: undefined,
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
        .content {
            min-height: 40rem;

            .error {
                padding: 3rem;
                background-color: $lightPink;
                color: $darkestPink;
            }
        }
    }

</style>
