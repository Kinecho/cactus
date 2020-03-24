<template>
  <div>
    <NavBar/>
    <section class="hero">
        <div class="centered" v-if="!coreValues">
            <h1>Get more with Cactus&nbsp;Plus</h1>
            <p class="subtext">Daily prompts, insights, core values, and&nbspmore</p>
            <a class="button btn primary" href="#upgrade">Upgrade</a>
        </div>
        <div class="centered" v-if="coreValues">
            <h1>Discover your Core&nbspValues</h1>
            <p class="subtext">Cactus Plus members get core values, daily prompts, and&nbsp;more</p>
            <a class="button btn primary" href="#upgrade">Upgrade</a>
        </div>
    </section>
    <div class="middleSections">
        <section class="benefits">
            <div class="centered">
                <div>
                  <h2 class="sectionHeader">Expand your mindfulness&nbsp;journey</h2>
                  <div class="flexContainer">
                      <div class="benefit">
                          <span class="benefitIcon"><img src="/assets/images/calendar.svg" alt=""/></span>
                          <h3>Make it daily</h3>
                          <p class="text">Become more focused at work, more positive at home with a fresh prompt, every&nbsp;day.</p>
                      </div>
                      <div class="benefit">
                          <span class="benefitIcon"><img src="assets/images/journal.svg" alt=""/></span>
                          <h3>Look back</h3>
                          <p class="text">As your journal fills up, celebrate and relive the positive forces in your&nbsp;life.</p>
                      </div>
                      <div class="benefit">
                          <span class="benefitIcon"><img src="/assets/images/lock.svg" alt=""/></span>
                          <h3>Private + secure</h3>
                          <p class="text">Your journal entries are yours—encrypted and never read or&nbsp;sold.</p>
                      </div>
                  </div>
              </div>
            </div>
        </section>
        <section class="insights feature">
            <div class="centered reverse" id="insights">
                <div class="sectionGraphic">
                    <img class="" src="assets/images/insights.svg" alt="insights graphic" />
                </div>
                <div class="textContainer">
                    <h4>New</h4>
                    <h3>Personal Insights</h3>
                    <p>Cactus will visualize your journey, revealing important insights about you, to you, like what you spend the most time reflecting on, what words come up often in your reflections, and&nbsp;more.</p>
                </div>
            </div>
        </section>
        <section class="coreValues feature">
            <div class="centered" id="coreValues">
                <div class="sectionGraphic">
                    <img class="" src="assets/images/coreValues.svg" alt="core values graphic" />
                </div>
                <div class="textContainer">
                    <h4>New</h4>
                    <h3>Core Values Assessment</h3>
                    <p>Is loyalty or honesty more important to you? Knowing your core values is critical in making decisions for your happiness. Cactus will use your core values to provide a personalized mindfulness&nbsp;journey.</p>
                </div>
            </div>
        </section>
    </div>
    <section class="upgrade">
        <div class="centered" id="upgrade">
            <h2 class="sectionHeader">Choose your plan:</h2>
            <PremiumPricing />
        </div>
    </section>
    <StandardFooter/>
  </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import StandardFooter from "@components/StandardFooter.vue";
    import NavBar from "@components/NavBar.vue";
    import PremiumPricing from "@components/PremiumPricing.vue";
    import {getQueryParam} from "@web/util";
    import {QueryParam} from "@shared/util/queryParams"
    import SnackbarContent from "@components/SnackbarContent.vue";

    export default Vue.extend({
    components: {
        StandardFooter,
        NavBar,
        PremiumPricing,
        SnackbarContent
    },
    data(): {
      coreValues: boolean,
    } {
        return {
            coreValues: false,
        }
    },
    created() {
      this.coreValues = getQueryParam(QueryParam.CORE_VALUES) == "true" || false;
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
