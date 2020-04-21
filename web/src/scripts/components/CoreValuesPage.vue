<template>
    <div class="coreValuesPage" :class="{inProgress: assessmentInProgress}">
        <NavBar :isSticky="false" v-if="!assessmentInProgress && !embed"/>
        <confetti :running="showConfetti"/>
        <button @click="showConfetti = !showConfetti">{{showConfetti ? "Show" : "Restart"}} Confetti</button>
        <div class="centered">
            <h1 v-if="!assessmentInProgress">Core Values</h1>
            <div v-if="errorMessage" class="alert error">
                {{errorMessage}}
            </div>
            <div v-if="loading || (embed && !appRegistered)">
                <h1>Loading</h1>
            </div>
            <template v-else-if="assessmentInProgress && assessment && assessmentResponse">
                <assessment :assessment="assessment" :assessmentResponse="assessmentResponse" @save="save" @completed="complete"/>
            </template>
            <template v-else-if="plusUser && !hasValues">
                <p>Core values are the general expression of what is most important for you, and they help you
                    understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration
                    of how your values have been at the heart of past decisions and how they will unlock a happier
                    future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <button class="primaryBtn" @click="startNewAssessment" :disabled="creatingAssessment">Take the
                    Assessment
                </button>
            </template>
            <template v-else-if="plusUser && hasValues">
                <p>Here are your core values. Through the Cactus prompts, you will come to better understand the origin,
                    purpose, and meaning of your core values. This will help you understand past life decisions and, by
                    prioritizing your values, make better decisions in the future.</p>
                <figure class="coreValuesCard">
                    <h3><span class="cvName" v-if="displayName">{{displayName}}'s</span>Core Values</h3>
                    <div class="flexContainer">
                        <div class="cvBlobContainer">
                            <img class="cvBlob" v-if="blobImageUrl" :src="blobImageUrl" alt="core value blob graphic"/>
                        </div>
                        <ul class="valuesList" v-if="coreValueResults">
                            <li v-for="(value, i) in coreValueResults" :key="`value_${i}`">
                                <span class="title">{{value.title}}</span>
                                <p class="description" v-if="false">
                                    {{value.description}}
                                </p>
                            </li>
                        </ul>
                    </div>
                </figure>
                <button class="small">Share My Values</button>

                <p class="extraPadding" v-if="newAssessmentAvailable">
                    A new assessment is available.
                    <a class="fancyLink" href="" @click.prevent="startNewAssessment" :disabled="creatingAssessment">Take
                        the assessment</a>.
                </p>
                <p class="extraPadding" v-if="!newAssessmentAvailable">Not sure these are right or feel like they’ve
                    changed? Feel free to
                    <a class="fancyLink" href="" @click.prevent="startNewAssessment" :disabled="creatingAssessment">retake&nbsp;the&nbsp;assessment</a>.
                </p>
            </template>
            <template v-else-if="!plusUser">
                <p>Different language? Core values are the general expression of what is most important for you, and
                    they help you understand past decisions and make better decisions in the future.</p>
                <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration
                    of how your values have been at the heart of past decisions and how they will unlock a happier
                    future. Your core values results will guide your Cactus reflections.</p>
                <p>Insert language about how long this will take or how many questions to set expectations...</p>
                <button class="primaryBtn" @click="goToPricing">Upgrade</button>
            </template>
        </div>
        <Footer v-if="!assessmentInProgress && !embed"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import NavBar from "@components/NavBar.vue";
    import Footer from "@components/StandardFooter.vue";
    import { SubscriptionTier } from "@shared/models/SubscriptionProductGroup";
    import CactusMember from '@shared/models/CactusMember'
    import CactusMemberService from '@web/services/CactusMemberService'
    import { PageRoute } from '@shared/PageRoutes'
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import { getIntegerFromStringBetween, isBlank } from "@shared/util/StringUtil";
    import Assessment from "@components/corevalues/Assessment.vue";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import AssessmentResponseService from "@web/services/AssessmentResponseService";
    import Logger from "@shared/Logger";
    import { CoreValueMeta, CoreValuesService } from "@shared/models/CoreValueTypes";
    import { getQueryParam, removeQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { isPremiumTier } from "@shared/models/MemberSubscription";

    interface CoreValuesData {
        loading: boolean,
        creatingAssessment: boolean,
        showConfetti: boolean,
        assessmentInProgress: boolean,
        member: CactusMember | null | undefined,
        memberObserver: ListenerUnsubscriber | null,
        assessment: CoreValuesAssessment,
        assessmentResponse: CoreValuesAssessmentResponse | null
        assessmentResponseObserver?: ListenerUnsubscriber,
        newAssessmentAvailable: boolean,
        appRegistered: boolean,
        appDisplayName: string | undefined,
        errorMessage: string | null,
        appMemberId: string | undefined,
        appSubscriptionTier: SubscriptionTier | undefined,
    }

    const logger = new Logger("CoreValuesPage");

    const blobUrls: string[] = [
        "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fsized%2F375_9999_99%2F200411.png?alt=media&token=6f2c2d46-d282-4c1a-87de-9259136c79a0",
        "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200425.png?alt=media&token=ed9a3600-eb1a-493b-ab41-49ac3ae19233",
        "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2004212.png?alt=media&token=b678702d-46b2-44b3-8bd9-1c62e08a27c3",
        "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200416.png?alt=media&token=32a014e0-10f3-4d07-bf01-9aa813b0a5e6"
    ]

    export default Vue.extend({
        components: {
            NavBar,
            Footer,
            Assessment,
            Confetti: () => import("@components/CactusConfetti.vue"),
        },
        created() {

        },
        props: {
            embed: { type: Boolean, default: false },
        },
        data(): CoreValuesData {
            return {
                loading: true,
                creatingAssessment: false,
                assessmentInProgress: false,
                member: null,
                showConfetti: false,
                memberObserver: null,
                assessment: CoreValuesAssessment.default(),
                assessmentResponse: null,
                assessmentResponseObserver: undefined,
                newAssessmentAvailable: false,
                appRegistered: false,
                appMemberId: undefined,
                appDisplayName: undefined,
                errorMessage: null,
                appSubscriptionTier: undefined,
            };
        },
        mounted(): void {
            if (this.embed) {
                try {
                    window.webkit.messageHandlers.appMounted.postMessage(true);
                } catch (error) {
                    logger.error("Failed to post message to webkit");
                }
            }
        },
        beforeMount() {
            if (this.embed) {
                this.loading = true;
                window.CactusIosDelegate = {
                    register: async (id: string, displayName: string, tier: SubscriptionTier) => {
                        this.appMemberId = id;
                        this.appDisplayName = displayName;
                        this.appSubscriptionTier = tier;
                        this.appRegistered = true;
                        const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(id);
                        if (currentResults) {
                            this.assessmentResponse = currentResults;
                            if (currentResults.assessmentVersion.localeCompare(this.assessment.version) < 0) {
                                this.newAssessmentAvailable = true;
                            }
                        }
                        this.loading = false
                        return "success"
                    }
                }
                return;
            }

            this.loading = true;
            this.memberObserver = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: async ({ member }) => {
                    this.member = member;
                    const memberId = member?.id;
                    if (memberId) {
                        if (!isBlank(getQueryParam(QueryParam.CV_LAUNCH)) && isPremiumTier(member?.tier)) {
                            this.startNewAssessment()
                            removeQueryParam(QueryParam.CV_LAUNCH);
                            return;
                        }

                        const currentResults = await AssessmentResponseService.sharedInstance.getLatestForUser(memberId);
                        if (currentResults) {
                            this.assessmentResponse = currentResults;
                            if (currentResults.assessmentVersion.localeCompare(this.assessment.version) < 0) {
                                this.newAssessmentAvailable = true;
                            }
                        }
                    }
                    this.loading = false;
                }
            })
        },
        beforeDestroy(): void {
            this.memberObserver?.()
        },
        methods: {
            goToPricing() {
                this.errorMessage = null
                if (this.embed) {
                    try {
                        window.webkit.messageHandlers.showPricing.postMessage(true);
                    } catch (error) {
                        this.errorMessage = error.message ?? "Unable to open the pricing page."
                        logger.error("Failed to post message to webkit");
                    }

                } else {
                    window.location.href = PageRoute.PRICING;
                }
            },
            async complete(assessmentResponse: CoreValuesAssessmentResponse) {
                this.showConfetti = true
                assessmentResponse.completed = true;
                // const assessmentResponse = this.assessmentResponse;
                // assessmentResponse.completed = true;
                assessmentResponse.results = this.assessment.getResults(assessmentResponse);
                // response.results = { values: [CoreValue.Power, CoreValue.Nature, CoreValue.Humor] };
                this.assessmentResponse = assessmentResponse
                await this.save(assessmentResponse);
                assessmentResponse.completed = true;
                this.assessmentInProgress = false
            },
            async save(assessmentResponse: CoreValuesAssessmentResponse) {
                const saved = await AssessmentResponseService.sharedInstance.save(assessmentResponse);
                if (saved) {
                    this.assessmentResponse = saved;
                }
            },
            async startNewAssessment() {
                const assessment = this.assessment;
                this.loading = true;
                const version = assessment.version;
                const memberId = this.member?.id ?? this.appMemberId;
                if (!memberId) {
                    logger.error("No member id was found, can't create assessment");
                    return;
                }

                //TODO: fetch existing responses??
                const response = CoreValuesAssessmentResponse.create({ version, memberId });
                const updatedResponse = await AssessmentResponseService.sharedInstance.save(response);

                this.assessmentResponseObserver = AssessmentResponseService.sharedInstance.observeById(updatedResponse!.id!, {
                    onData: response => {
                        if (response) {
                            this.assessmentResponse = response;
                        }
                        this.loading = false;
                        this.assessmentInProgress = true;
                    }
                });
            },
        },
        computed: {
            hasValues(): boolean {
                return (this.assessmentResponse?.completed ?? false) && (this.assessmentResponse?.results?.values ?? []).length > 0;
            },
            blobImageUrl(): string | null {
                let results = this.coreValueResults
                if (!this.hasValues || !results) {
                    return null
                }
                let valueString = results.map(r => r.title).join("");
                const index = getIntegerFromStringBetween(valueString, blobUrls.length)
                return blobUrls[index];

            },
            coreValueResults(): CoreValueMeta[] | undefined {
                let values = this.assessmentResponse?.results?.values;
                if (!values) {
                    return undefined;
                }
                return values.map(v => CoreValuesService.shared.getMeta(v));
            },
            plusUser(): boolean {
                const tier = this.member?.tier ?? this.appSubscriptionTier ?? SubscriptionTier.BASIC;
                return tier === SubscriptionTier.PLUS
            },
            displayName(): string {
                if (this.embed && this.appDisplayName) {
                    return this.appDisplayName;
                }

                return !isBlank(this.member?.firstName) ? this.member?.firstName ?? "" : this.member?.getFullName() ?? ""
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .coreValuesPage {
        display: flex;
        flex-flow: column nowrap;
        min-height: 100vh;
        justify-content: space-between;
        overflow: hidden;
        position: relative;

        &.inProgress {
            @include r(768) {
                background-color: $beige;
            }

            .centered {
                padding: 0;
            }
        }

        header, .centered {
            width: 100%;
        }

        .centered {
            flex-grow: 1;
            max-width: 768px;
            padding: 0 2.4rem 6.4rem;
            text-align: left;
        }

        h1 {
            margin: 3.2rem 0 1.6rem;

            @include r(768) {
                margin: 6.4rem 0 1.6rem;
            }
        }

        p {
            margin-bottom: 1.6rem;
            max-width: 64rem;
        }
    }

    .primaryBtn {
        display: block;
        margin-top: 2.4rem;
        width: 100%;

        @include r(600) {
            width: auto;
        }
    }

    .coreValuesCard {
        @include shadowbox;
        background-color: darken($royal, 6%);
        color: white;
        margin: 1.6rem auto 2.4rem;
        max-width: fit-content;
        padding: 2.4rem 0;
        text-align: center;
        width: auto;

        @include r(768) {
            margin: 3.2rem 0;
        }

        .flexContainer {
            display: flex;
        }

        .cvName {
            padding-right: .4rem;
        }

        h3 {
            margin-bottom: 1.6rem;
        }
    }

    .valuesList {
        align-self: center;
        list-style: none;
        margin: 0 0 0 1.6rem;
        padding: 0 1.6rem 0 0;
        text-align: center;
        width: 100%;

        @include r(768) {
            width: 50%;
        }

        li {
            font-size: 1.4rem;
            font-weight: bold;
            letter-spacing: 1px;
            list-style: none;
            margin: 0 0 .8rem;
            padding: 0;
            text-transform: uppercase;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }

    .cvBlobContainer {
        align-self: flex-start;
        height: auto;
        margin-bottom: -3.2rem;
        max-width: 20rem;
        transform: translate(-.8rem);
        width: 50%;

        .cvBlob {
            width: 100%;
            height: 100%;
        }
    }


    button.small {
        display: flex;
        margin: 0 auto;

        @include r(768) {
            margin: 0;
        }
    }

    .fancyLink {
        @include fancyLink;
    }

    .extraPadding {
        margin-top: 6.4rem;
    }

</style>
