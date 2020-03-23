<template>
  <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
    <div slot="body" class="miniModal">
        <div class="upperInfo">
            <div class="miniHero">
                <h2>Keep going with Cactus&nbsp;Plus</h2>
                <p class="subtext">With Cactus Plus, you'll get immediate access to today's prompt, and these popular features:</p>
            </div>
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
        </div>
        <div class="pricingWrapper">
            <PremiumPricing :startTrial="true" />
        </div>
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
      background: $beige url(assets/images/beigeBlob.svg) center top -65vw/124vw no-repeat;
      margin: 0 auto;
      min-height: 100vh;
      text-align: center;

      @include r(600) {
          @include shadowbox;
          background-color: $beige;
          background-position: center top -92rem;
          background-size: 111rem;
          max-width: 64rem;
          min-height: 0;
      }

      .subtext {
          font-size: 1.6rem;
          margin: 0 auto;
          max-width: 64rem;

          @include r(600) {
              font-size: 1.8rem;
          }
      }

      .benefit {
          display: flex;
          margin: 0 0 1.6rem;
          max-width: none;
          padding: 0 1.6rem;
          text-align: left;

          @include r(374) {
              padding: 0 2.4rem;
          }
          @include r(600) {
              align-items: center;
              padding: 0 3.2rem;
          }

          &:last-of-type {
              margin-bottom: 3.2rem;
          }

          p {
              font-size: 1.6rem;

              @include r(600) {
                  font-size: 1.8rem;
              }
          }
      }

      h3 {
          font-size: 1.8rem;
          margin-bottom: 0;

          @include r(600) {
              font-size: 2.1rem;
          }
      }

      .benefitIcon {
          background-color: transparent;
          flex-shrink: 0;
          margin: -1.5rem 1.2rem 0 0;
          width: 3rem;

          @include r(600) {
              width: 6.4rem;
          }
      }
  }

  .miniHero {
      padding: 1.6rem 1.6rem 4rem;

      @include r(374) {
          padding: 2.4rem 2.4rem 4rem;
      }
      @include r(600) {
          padding: 3.2rem 3.2rem 4rem;
      }
  }

  .pricingWrapper {
      background: $dolphin url(assets/images/grainy.png) repeat;
      padding: 0 0 2.4rem;

      @include r(600) {
          border-radius: 0 0 1.2rem 1.2rem;
          padding: 0 2.4rem;
      }

      .button {
          display: block;
          margin: -4rem 2.4rem 0;
          position: relative;

          @include r(600) {
              margin: 0 auto;
              max-width: 33rem;
          }
      }
  }
</style>
