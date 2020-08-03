<template>
    <div class="miniCoreValuesPage">
        <assessment
                :assessment="assessment"
                :questions="questions"
                :question-index="questionIndex"
                :assessmentResponse="response"
                :loading="loading"
                :done="done"
                :show-close-button="false"
                @start="onStart"
                @response="onResponse"
                @next="next"
                @previous="previous"
                @save="save"
                @close="close"
                @completed="completed"
        />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component"
import Assessment from "@components/corevalues/Assessment.vue";
import CoreValuesAssessment from "@shared/models/CoreValuesAssessment";
import CoreValuesQuestion from "@shared/models/CoreValuesQuestion";
import CoreValuesQuestionResponse from "@shared/models/CoreValuesQuestionResponse";
import CoreValuesAssessmentResponse, { CoreValuesResults } from "@shared/models/CoreValuesAssessmentResponse";
import CactusMember from "@shared/models/CactusMember";
import { Prop } from "vue-property-decorator";
import Logger from "@shared/Logger"
import { logCoreValuesAssessmentCompleted } from "@web/analytics";

const logger = new Logger("MiniCoreValuesCard");


@Component({
    components: {
        Assessment
    }
})
export default class MiniCoreValuesCard extends Vue {
    name = "MiniCoreValuesCard";

    @Prop({ type: Object as () => CactusMember, required: true })
    member!: CactusMember;

    @Prop({type: Object as () => CoreValuesAssessmentResponse, required: false,})
    coreValuesResponse!: CoreValuesAssessmentResponse|null;

    assessment = CoreValuesAssessment.onboarding()
    questions: CoreValuesQuestion[] = []
    response: CoreValuesAssessmentResponse | null = null;
    questionIndex = 0;
    done = false
    loading = false

    async beforeMount() {
        this.questions = this.assessment.getQuestions();
        this.response = this.coreValuesResponse ?? CoreValuesAssessmentResponse.create({
            version: this.assessment.version,
            memberId: this.member.id!,
        });
    }

    async next() {
        if (this.questionIndex < this.questions.length - 1) {
            this.questionIndex += 1;
        } else {
            await this.completed()
        }
    }

    async previous() {
        if (this.questionIndex > 0) {
            this.questionIndex -= 1;
        }

    }

    async save() {
        if (this.response) {
            this.$emit("coreValuesResponse", this.coreValuesResponse)
        }
    }

    async onStart() {
        //no op
    }

    async onResponse(response: CoreValuesQuestionResponse) {
        this.response?.setResponse(response);
        // await this.save()
    }

    close() {
        //noop
    }

    async completed() {
        // logCoreValuesAssessmentCompleted();
        logger.info("Completing core mini values");
        const assessmentResponse = this.response;
        if (!assessmentResponse) {
            logger.info("there was no assessment response")
            return;
        }
        // assessmentResponse.completed = true;
        assessmentResponse.results = this.assessment.getResults(assessmentResponse);
        this.response = assessmentResponse
        assessmentResponse.completed = true;

        this.$emit("coreValuesResponse", assessmentResponse)
        this.$emit("next")
    }

}
</script>

<style scoped lang="scss">
@import "variables";
@import "mixins";
@import "assessment";


.miniCoreValuesPage {
  display: flex;
  flex-flow: column nowrap;
  min-height: 100vh;
  justify-content: space-between;
  overflow: hidden;
  position: relative;

  //&:after {
  //  background: url(/assets/images/cvBlob.png) no-repeat;
  //  content: "";
  //  display: block;
  //  height: 35rem;
  //  overflow: hidden;
  //  position: absolute;
  //  left: 70%;
  //  top: -26rem;
  //  width: 40rem;
  //}

  //&:before {
  //  background: url(/assets/images/pinkVs.svg) no-repeat;
  //  background-size: cover;
  //  content: "";
  //  display: block;
  //  height: 17rem;
  //  overflow: hidden;
  //  position: absolute;
  //  right: 70%;
  //  top: 70%;
  //  width: 18rem;
  //}

  //@include r(768) {
  //  background: $mediumDolphin url(/assets/images/grainy.png);
  //
  //  &:after {
  //    top: -22rem;
  //    z-index: 0;
  //  }
  //}

  header, .centered {
    width: 100%;
  }

  .centered {
    flex-grow: 1;
    max-width: 768px;
    padding: 0;
    position: relative;
    text-align: left;
    width: 100%;
    z-index: 1;
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
</style>