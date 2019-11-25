<template>
  <section class="premium">
      <div class="centered">
        <div class="textContainer">
            <h2>Choose your Cactus</h2>
            <p class="subtext">Free to use, better with&nbsp;Premium</p>
        </div>
        <div class="graphics">
            <img class="blobGraphic" src="/assets/images/royalBlob.png" alt="" />
            <img class="arcGraphic" src="/assets/images/arc.svg" alt="" />
        </div>
        <div class="tabset">
            <input type="radio" name="tabset" id="tab1" aria-controls="free" checked>
            <label class="tab-label free-tab" for="tab1">Free</label>
            <section id="free" class="tab-panel free-panel">
                <h3 class="tab-header free-header">Free</h3>
                <ul>
                    <li>Available on web</li>
                    <li>Unlimited reflection notes</li>
                    <li>Daily reflection prompts</li>
                    <li>128-bit encryption on&nbsp;notes</li>
                    <li>Notifications via email</li>
                </ul>
                <button class="secondary" @click="goToSignup">Sign Up Free</button>
            </section>

            <input type="radio" name="tabset" id="tab2" aria-controls="premium">
            <label class="tab-label premium-tab" for="tab2">Premium<span class="newStatus">New</span></label>
            <section id="premium" class="tab-panel premium-panel">
                <h3 class="tab-header premium-header">Premium<span class="newStatus">New</span></h3>
                <ul>
                    <li>Available on web</li>
                    <li><span class="enhance">Available on iPhone and iPad</span></li>
                    <li>Unlimited reflection notes</li>
                    <li>Daily reflection prompts</li>
                    <li>128-bit encryption on&nbsp;notes</li>
                    <li>Notifications via email</li>
                    <li><span class="enhance">Notifications via push</span></li>
                    <li class="heart"><span class="enhance">Supports Cactus development</span></li>
                </ul>
                <div class="flexContainer">
                <template v-for="plan in plans">
                    <div class="planButton" :id="plan.id" :aria-controls="plan.name" @click="selectPlan(plan)" :class="{selected: isSelectedPlan(plan)}">
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
    import {PageRoute} from '@shared/PageRoutes';
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
                required: false,
                default: function() { 
                  return [
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
            },
            isSelectedPlan(plan: PremiumPlan) {
              return plan == this.selectedPlan
            },
            goToSignup() {
              window.location.href = PageRoute.SIGNUP;
            }
        },

    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .premium {
        background: #1D7A81 url(assets/images/grainy.png);
        color: $white;
        padding: 4.8rem 0 0;

        @include r(768) {
            padding: 9rem 2.4rem 0;
        }

        .centered {
            overflow: hidden;
            position: relative;

            @include r(960) {
                display: flex;
                flex-direction: row-reverse;
                justify-content: center;
                text-align: left;
            }
        }
    }

    .textContainer {
        @include r(960) {
            padding: 19rem 0 0 4.8rem;
        }

        h2 {
            line-height: 1.1;
            margin-bottom: .8rem;
        }
    }

      .subtext {
          padding: 0 2.4rem 2.4rem;

          @include r(768) {
              padding: 0 0 4rem;
          }
      }

      .graphics {
          bottom: -3rem;
          left: 0;
          position: absolute;
          right: 0;

          .blobGraphic {
              bottom: 0;
              right: -8rem;
              position: absolute;

              @include r(768) {
                  right: 0;
              }
              @include r(960) {
                  left: 51%;
                  right: auto;
              }
          }

          .arcGraphic {
              bottom: -12rem;
              height: auto;
              left: -2rem;
              position: relative;
              width: 95rem;

              @include r(768) {
                  left: 0;
                  width: 109%;
              }
              @include r(960) {
                  left: 3%;
                  top: 3rem;
                  width: 75%;
              }
          }
      }

      .tabset {
          background-color: $darkestGreen;
          border-radius: 1.2rem 1.2rem 0 0;
          display: grid;
          grid-template-areas:
              "tab1 tab2"
              "tabpanel tabpanel";
          grid-template-columns: 48% 52%;
          position: relative;
          text-align: left;

          @include r(374) {
              margin: 0 2.4rem;
          }

          @include r(600) {
              margin: 0 auto;
              max-width: 90%;
          }
          @include r(768) {
              background-color: transparent;
              grid-template-areas: "tabpanel1 tabpanel2";
              max-width: 74rem;
          }
          @include r(960) {
              margin: 0;
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

      .newStatus {
          display: none;

          @include r(600) {
              background-color: $aqua;
              border-radius: 2rem;
              color: $darkestGreen;
              display: inline-block;
              font-size: 1.4rem;
              font-weight: bold;
              letter-spacing: 1px;
              margin-left: .8rem;
              padding: 0 .8rem;
              text-transform: uppercase;
              vertical-align: super;
          }
      }

      .tab-panel {
          grid-area: tabpanel;
          padding: 2.4rem 2.4rem 3.2rem;

          @include r(768) {
              padding: 3.2rem;

              &.free-panel {
                  align-self: end;
                  background-color: $white;
                  border-radius: 1.8rem 0 0 0;
                  color: $darkestGreen;
                  grid-area: tabpanel1;

                  ul {
                      margin-bottom: 7.2rem;
                  }
              }
              &.premium-panel {
                  background-color: $darkestGreen;
                  border-radius: 1.8rem 1.8rem 0 0;
                  grid-area: tabpanel2;
              }
          }

          ul {
              list-style: none;
              margin: 0 0 4rem -.6rem;
              min-width: 26rem;
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

              &.heart:before {
                background-image: url(assets/icons/heart.svg);
                height: 1.5rem;
              }
          }

          button {
              max-width: none;
              white-space: nowrap;
              width: 100%;
          }
      }

      .enhance {
          background:
            linear-gradient(transparentize($royal, .4), transparentize($royal, .4)) 0 90%/100% .8rem no-repeat,
            url(assets/images/grainy.png) repeat;
          display: inline;
          padding-right: .2rem;
      }

      .flexContainer {
          display: flex;
          margin-bottom: 2.4rem;
          justify-content: space-between;

          .planButton {
              background-color: transparentize($white, .9);
              border: 2px solid $darkestGreen;
              border-radius: .8rem;
              cursor: pointer;
              font-size: 1.6rem;
              padding: .8rem;
              text-align: center;
              width: 49%;

              &.selected {
                  border-color: $green;
                  box-shadow: inset 0 0 0 .4rem $darkestGreen;
              }

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
</style>
