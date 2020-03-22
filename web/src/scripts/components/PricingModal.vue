<template>
  <div>
    <section class="hero">
        <div class="centered">
            <h1>Keep going with Cactus&nbspPlus</h1>
            <p class="subtext">With Cactus Plus, you'll get immediate access to today's prompt, and these popular features:</p>
        </div>
    </section>
    <div class="middleSections">
        <section class="benefits">
            <div class="centered">
              <div>
                <div class="flexContainer">
                      <div class="benefit">
                          <span class="benefitIcon"><img src="/assets/images/calendar.svg" alt=""/></span>
                          <h3>Make it daily</h3>
                          <p class="text">Improve your focus and positivity at work and home with a fresh prompt, every&nbsp;day.</p>
                      </div>
                      <div class="benefit">
                          <span class="benefitIcon"><img src="assets/images/journal.svg" alt=""/></span>
                          <h3>Personal Insights</h3>
                          <p class="text">Visualizations reveal the people, places, and things that contribute to your&nbsp;satisfaction.</p>
                      </div>
                      <div class="benefit">
                          <span class="benefitIcon"><img src="/assets/images/lock.svg" alt=""/></span>
                          <h3>Core Values Assessment</h3>
                          <p class="text">Make better decisions by prioritizing what's important to you.</p>
                      </div>
                  </div>
                </div>
            </div>
        </section>
    </div>
    <section class="upgrade">
        <div class="centered" id="upgrade">
            <h2 class="sectionHeader">Choose your plan:</h2>
            <PremiumPricing :startTrial="true" />
        </div>
    </section>
  </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import PremiumPricing from "@components/PremiumPricing.vue";

    export default Vue.extend({
    components: {
        PremiumPricing,
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
  
  .top-message {
      border-radius: 0;
      display: block;
      padding: 3.2rem 2.4rem;
      margin-bottom: 0;

      .centered {
          max-width: 64rem;
      }

      p {
          opacity: .9;
      }

      a {
          @include fancyLinkLight;
      }
  }
</style>
