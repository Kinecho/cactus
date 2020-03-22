<template>
  <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
    <div slot="body" class="miniModal">
        <h2>Keep going with Cactus&nbsp;Plus</h2>
        <p class="subtext">With Cactus Plus, you'll get immediate access to today's prompt, and these popular features:</p>
        <div class="benefit">
            <span class="benefitIcon"><img src="/assets/images/calendar.svg" alt=""/></span>
            <div>
                <h3>Make it daily</h3>
                <p class="text">Improve your focus and positivity at work and home with a fresh prompt, every&nbsp;day.</p>
            </div>
        </div>
        <div class="benefit">
            <span class="benefitIcon"><img src="/assets/images/journal.svg" alt=""/></span>
            <div>
                <h3>Personal Insights</h3>
                <p class="text">Visualizations reveal the people, places, and things that contribute to your&nbsp;satisfaction.</p>
            </div>
        </div>
        <div class="benefit">
            <span class="benefitIcon"><img src="/assets/images/lock.svg" alt=""/></span>
            <div>
                <h3>Core Values Assessment</h3>
                <p class="text">Make better decisions by prioritizing what's important to you.</p>
            </div>
        </div>
        <PremiumPricing :startTrial="true" />
        <a class="button secondary" href="#upgrade">Learn More</a>
    </div>
  </modal>
</template>

<script lang="ts">
    import Vue from "vue"
    import PremiumPricing from "@components/PremiumPricing.vue";
    import Modal from "@components/Modal.vue";

    export default Vue.extend({
    components: {
        PremiumPricing,
        Modal,
    },
    props: {
        showModal: {type: Boolean, default: false},
    },
    data(): {
    } {
        return {
        }
    }
  });
</script>

<style scoped lang="scss">
  @import "~styles/common";
  @import "~styles/mixins";
  @import "~styles/transitions";
  @import "~styles/pages/pricing";

  .miniModal {
      @include shadowbox;
      background-color: $beige;
      min-height: 100vh;
      padding: .8rem;
      text-align: center;

      @include r(374) {
          padding: 2.4rem;
      }
      @include r(600) {
          min-height: 0;
          padding: 3.2rem;
      }

      .subtext {
          margin: 0 auto 4rem;
          max-width: 64rem;
      }

      .benefit {
          display: flex;
          margin: 0 0 1.6rem;
          max-width: none;
          text-align: left;

          @include r(600) {
              align-items: center;
          }

          &:last-of-type {
              margin-bottom: 4rem;
          }
      }

      h3 {
          margin-bottom: 0;
      }

      .benefitIcon {
          margin: 0;
      }
  }
</style>
