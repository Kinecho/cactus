<template>
    <div class="assessment-container">
        <div v-if="loading">
            <h3>Loading</h3>
        </div>
        <div v-if="completed">
            <h3>The survey is completed.</h3>
        </div>
        <div v-else-if="currentQuestion && currentResponse">
            <question-card :question="currentQuestion" :response="currentResponse" @updated="updateResponse"/>
        </div>
<!--        <div v-else>-->
<!--            <h1>Values Assessment</h1>-->
<!--            <p>There are {{questions.length}} questions in the survey. </p>-->

<!--            <p>Core values are the general expression of what is most important for you, and they help you-->
<!--                understand past decisions and make better decisions in the future.</p>-->
<!--            <p>Knowing your core values is just the beginning. Cactus will help you prioritize a deeper exploration-->
<!--                of how your values have been at the heart of past decisions and how they will unlock a happier-->
<!--                future. Your core values results will guide your Cactus reflections.</p>-->
<!--            <p>Insert language about how long this will take or how many questions to set expectations...</p>-->
<!--            &lt;!&ndash; TODO: hook up button &ndash;&gt;-->
<!--            <button class="primaryBtn" @click="start">Take the Assessment</button>-->
<!--        </div>-->
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
    import CoreValuesAssessmentResponse from "@shared/models/CoreValuesAssessmentResponse";
    import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
    import { isNull, isNumber } from "@shared/util/ObjectUtil";

    import QuestionCard from "@components/corevalues/Question.vue";
    import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
    import Logger from "@shared/Logger";
    import { ListenerUnsubscriber } from "@web/services/FirestoreService";
    import AssessmentResponseService from "@web/services/AssessmentResponseService";
    import CactusMemberService from "@web/services/CactusMemberService";

    const logger = new Logger("Assessment");

    export default Vue.extend({
        name: "Assessment",
        components: {
            QuestionCard,
        },

        props: {
            assessment: {type: Object as () => CoreValuesAssessment, required: true},
            assessmentResponse: {type: Object as () => CoreValuesAssessmentResponse, required: true},
        },

        data(): {
            loading: boolean,
            questionIndex: number | null,
            completed: boolean,
        } {
            return {
                loading: false,
                questionIndex: 0,
                completed: false,
            }
        },
        computed: {
            questions(): CoreValuesQuestion[] {
                return this.assessment.questions;
            },
            currentQuestion(): CoreValuesQuestion | null {
                const index = this.questionIndex;
                if (isNumber(index) && index < this.questions.length) {
                    return this.questions[index];
                }
                return null;
            },
            currentResponse(): CoreValuesQuestionResponse | null {
                const questionId = this.currentQuestion?.id;
                if (!questionId) {
                    return null;
                }
                return this.assessmentResponse?.getResponseForQuestion(questionId) ?? null;
            }
        },
        methods: {
            /**
             * Save the answers to the DB or send back to the app
             * @return {Promise<void>}
             */
            async submit() {

            },

            async save() {
                if (this.assessmentResponse) {
                    await AssessmentResponseService.sharedInstance.save(this.assessmentResponse);
                }
            },
            start() {
                this.questionIndex = 0;
            },
            async updateResponse(response: CoreValuesQuestionResponse) {
                logger.info("setting response with value", response.values);
                this.assessmentResponse?.setResponse(response);
                logger.info("assessment response", this.assessmentResponse);
                await this.save()
                // this.assessmentResponse = this.assessmentResponse.copy();
                // this.$set(this.assessmentResponse, "questionResponses", this.assessmentResponse.questionResponses);
            },
            nextQuestion() {
                if (isNull(this.currentQuestion)) {
                    this.questionIndex = 0;
                    return;
                } else if (isNumber(this.questionIndex)) {
                    let nextIndex = this.questionIndex + 1;
                    if (nextIndex >= this.questions.length) {
                        this.completed = true;
                    } else {
                        this.questionIndex = nextIndex;
                    }
                }
            }
        },
    })
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .assessment-container {
        background: $lightestGreen;
    }
</style>