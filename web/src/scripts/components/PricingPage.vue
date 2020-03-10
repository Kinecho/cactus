<template>
  <div>
    <NavBar/>
    <snackbar-content
        class="top-message"
        v-if="message"
        :closeable="true"
        key="top-message"
        :autoHide="false"
        color="successAlt">
        <div slot="text" class="centered">
          <p>{{message}}</p>
        </div>
    </snackbar-content>
    <section class="hero">
        <div class="centered">
            <h1>Get more with Cactus&nbsp;Plus</h1>
            <p class="subtext">Daily prompts, personal insights, and more</p>
            <a class="button btn primary" href="#upgrade">Upgrade</a>
        </div>
    </section>
    <div class="middleSections">
        <section class="benefits">
            <div class="centered">
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
                    <h4>Coming Soon</h4>
                    <h3>Core Values Assessment</h3>
                    <p>Is loyalty or honesty more important to you? Knowing your core values is critical in making decisions for your happiness. Cactus will use your core values to provide a personalized mindfulness&nbsp;journey.</p>
                </div>
            </div>
        </section>
    </div>
    <section class="upgrade">
        <div class="centered" id="upgrade">
            <h2 class="sectionHeader">Upgrade to Plus</h2>
            <PremiumPricing/>
        </div>
    </section>
    <StandardFooter/>
  </div>
</template>

<script lang="ts">
  import Vue from "vue"
  import StandardFooter from "@components/StandardFooter.vue";
  import NavBar from "@components/NavBar.vue";
  import {commonInit} from "@web/common";
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
            message: string | undefined,
        } {
            return {
                message: undefined,
            }
        },
    created() {
      this.message = getQueryParam(QueryParam.MESSAGE) || undefined;
    }
  });
</script>

<style scoped lang="scss">
  @import "~styles/common";
  @import "~styles/mixins";
  @import "~styles/transitions";
  
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
