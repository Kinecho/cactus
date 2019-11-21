<template>
  <section class="premium">
      <div class="centered">
        <h2>Introducing Premium</h2>
        <p class="subtext">Get more from Cactus, now conveniently in your&nbsp;pocket</p>

        <div class="tabset">
            <input type="radio" name="tabset" id="tab1" aria-controls="free" checked>
            <label class="tab-label free-tab" for="tab1">Free</label>
            <section id="free" class="tab-panel free-panel">
                <h3 class="tab-header free-header">Free</h3>
                <ul>
                    <li>Available on web</li>
                    <li>Unlimited reflection journal note archive</li>
                    <li>Daily reflection prompts</li>
                    <li>128-bit encryption on all notes</li>
                    <li>Notifications via email</li>
                </ul>
                <button class="secondary">Sign Up Free</button>
            </section>

            <input type="radio" name="tabset" id="tab2" aria-controls="premium">
            <label class="tab-label premium-tab" for="tab2">Premium</label>
            <section id="premium" class="tab-panel premium-panel">
                <h3 class="tab-header premium-header">Premium</h3>
                <ul>
                    <li>Available on web</li>
                    <li><span class="enhance">Available on iPhone and iPad</span></li>
                    <li>Unlimited reflection journal note archive</li>
                    <li>Daily reflection prompts</li>
                    <li>128-bit encryption on all notes</li>
                    <li>Notifications via email</li>
                    <li><span class="enhance">Notifications via push</span></li>
                </ul>
                <div class="flexContainer">
                <template v-for="plan in plans">
                    <div class="planButton" :id="plan.id" :aria-controls="plan.name" @click="selectPlan(plan)">
                        <span>{{plan.name}}</span>
                        <span>${{plan.price_dollars}}</span>
                        <span>per {{plan.per}}</span>
                    </div>
                </template>
                </div>
                <button v-bind:disabled="isProcessing" @click="puchaseSelectedPlan">Upgrade &mdash; ${{selectedPlan.price_dollars}} / {{selectedPlan.per}}</button>
            </section>

        </div>
      </div>
  </section>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from "@web/config";
    import {PageRoute} from '@web/PageRoutes';
    import {PremiumPlan} from '@shared/types/PlanTypes';
    import CactusMember from "@shared/models/CactusMember";
    import CactusMemberService from '@web/services/CactusMemberService';
    import {configureStripe, redirectToCheckoutWithPlanId} from "@web/checkoutService";
    import {ListenerUnsubscriber} from '@web/services/FirestoreService';

    export default Vue.extend({
        created() {

        },
        props: {
          plans: {
                type: Array as () => PremiumPlan[],
                required: true,
                default: [
                          { 
                            id: Config.stripe.monthlyPlanId, 
                            plan_param: 'm', 
                            name: 'Monthly', 
                            price_dollars: 2.99, 
                            per: 'month' 
                          },
                          { 
                            id: Config.stripe.yearlyPlanId, 
                            plan_param: 'y', 
                            name: 'Annual', 
                            price_dollars: 29, 
                            per: 'year' 
                          }
                        ]   
          }
        },
        data(): {
          selectedPlan: PremiumPlan | undefined,
          isProcessing: boolean,
          member: CactusMember | undefined | null,
          memberEmail: string | undefined,
          memberUnsubscriber: ListenerUnsubscriber | undefined,
        } {
            return {
              selectedPlan: this.plans[0],
              isProcessing: false,
              member: undefined,
              memberEmail: undefined,
              memberUnsubscriber: undefined    
            }
        },
        beforeMount() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;

                    if (this.member?.email) {
                      this.memberEmail = this.member.email;
                    }
                }
            })
        },
        destroyed() {
            
        },
        computed: {
            
        },
        watch: {
            
        },
        methods: {
            selectPlan(plan: PremiumPlan) {
              this.selectedPlan = plan;
            },
            async puchaseSelectedPlan() {
              this.isProcessing = true;

              if (this.selectedPlan && this.selectedPlan.id) {
                configureStripe('checkout-button', this.selectedPlan.id);
                await redirectToCheckoutWithPlanId(this.selectedPlan.id, this.memberEmail);
              } else {
                this.isProcessing = false;
                alert('There was a problem. Please contact us at help@cactus.app.');
              }
            }
        },

    })
</script>

<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

  .premium {
      background: #1D7A81 url(assets/images/darkGreenNeedles.svg) 0 0/31rem;
      color: $white;
      padding: 4.8rem 0 0;

      @include r(768) {
          padding: 11rem 0 0;
      }

      .subtext {
          padding: 0 2.4rem 2.4rem;

          @include r(768) {
              padding-bottom: 4rem;
          }
      }

      .tabset {
          background-color: $darkestGreen;
          border-radius: 1.2rem 1.2rem 0 0;
          display: grid;
          grid-template-areas:
              "tab1 tab2"
              "tabpanel tabpanel";
          grid-template-columns: repeat(2, 1fr);
          margin: 0 .8rem;
          text-align: left;

          @include r(374) {
              margin: 0 2.4rem;
          }
          @include r(600) {
              margin: 0 auto;
              max-width: 60rem;
          }
          @include r(768) {
              background-color: transparent;
              grid-template-areas: "tabpanel1 tabpanel2";
              grid-template-columns: 29rem 34rem;
              margin: 0;
              max-width: none;
          }
      }

      /* hide the radios, show the panels */
      .tabset input[type="radio"] {
          position: absolute;
          left: -200vw;

          @include r(768) {
              display: none;
          }
      }
      .tabset .tab-panel,
      .tab-header {
          display: none;

          @include r(768) {
              display: block;
          }
      }
      .tabset > input:nth-of-type(1):checked ~ .tab-panel:nth-of-type(1),
      .tabset > input:nth-of-type(2):checked ~ .tab-panel:nth-of-type(2) {
          display: block;
      }

      .tab-label {
          background-color: darken($darkestGreen, 5%);
          cursor: pointer;
          font-size: 2rem;
          font-weight: bold;
          padding: 1.6rem;
          text-align: center;

          &:nth-of-type(1) {
              border-radius: 1.2rem 0 0 0;
          }
          &:nth-of-type(2) {
              border-radius: 0 1.2rem 0 0;
          }

          @include r(768) {
              display: none;
          }
      }

      .tabset > .tab-label:hover {
          background-color: darken($darkestGreen, 3%);
      }
      .tabset > input:focus + .tab-label,
      .tabset > input:checked + .tab-label {
          background-color: $darkestGreen;
      }

      .tab-header {
          font-size: 2.4rem;
          margin-bottom: 2.4rem;
      }

      .tab-panel {
          grid-area: tabpanel;
          padding: 2.4rem 2.4rem 3.2rem;

          @include r(768) {
              &.free-panel {
                  align-self: end;
                  background-color: $white;
                  border-radius: 1.8rem 0 0 0;
                  color: $darkestGreen;
                  grid-area: tabpanel1;
              }
              &.premium-panel {
                  background-color: $darkestGreen;
                  border-radius: 1.8rem 1.8rem 0 0;
                  grid-area: tabpanel2;
              }
          }

          ul {
              list-style: none;
              margin: 0 0 3.2rem -.6rem;
          }

          li {
              margin-bottom: 1.2rem;
              text-indent: -3.4rem;

              &:before {
                  background-image: url(assets/images/check.svg);
                  background-repeat: no-repeat;
                  background-size: contain;
                  content: "";
                  display: inline-block;
                  height: 1.3rem;
                  margin-right: 1.6rem;
                  width: 1.8rem;
              }
          }

          button {
              max-width: none;
              width: 100%;
          }
      }

      .enhance {
          background: linear-gradient(transparentize($royal, .4), transparentize($royal, .4)) 0 90%/100% .8rem no-repeat;
          display: inline;
          padding-right: .2rem;
      }

      .flexContainer {
          display: flex;
          margin-bottom: 2.4rem;
          justify-content: space-between;

          > input:focus,
          > input:checked {
              + label {
                  border-color: $green;
              }
          }

          .planButton {
              background-color: transparentize($white, .9);
              border: 2px solid $darkestGreen;
              border-radius: .8rem;
              cursor: pointer;
              font-size: 1.6rem;
              padding: .8rem;
              text-align: center;
              width: 49%;

              span {
                  display: block;

                  &:nth-child(1) {
                      font-size: 1.4rem;
                      letter-spacing: 1px;
                      text-transform: uppercase;
                  }
                  &:nth-child(2) {
                      font-size: 2rem;
                  }
              }
          }
      }
  }
</style>
