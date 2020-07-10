<template>
    <div v-if="element" class="element-animation">
        <svg class="element experience" v-if="element === 'experience'" xmlns="http://www.w3.org/2000/svg" width="41" height="38" viewBox="0 0 41 38">
            <g fill="none" fill-rule="evenodd" stroke="#6590ED" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" transform="translate(1 1)">
                <path class="path" vector-effect="non-scaling-stroke" d="M-1.81188398e-13,35.246933 C0.0955698487,33.6492577 0.474909168,31.3864005 1.64407979,30.4663022 C3.92206117,28.67374 6.13150083,32.9299494 9.36265464,27.8457684 C10.1024929,26.6815037 10.3137877,25.1122828 11.2004578,24.0504606 C15.6146645,18.7642753 25.1258736,17.4281892 27.6484832,16.1881084 C29.0086316,15.5192755 29.4108752,12.9332717 30.4054169,11.7599992 C32.3777084,9.43222044 33.1756401,9.03454553 36.1024694,7.78378378"/>
                <path class="path d0" vector-effect="non-scaling-stroke" d="M-4.44311254e-13 11.9534644C1.83528374 9.91921096.570066663 7.62404743.289849563 4.94766847.163475338 3.73973873.519830374 1.03473933.844707074 1.77635684e-15M5.85365854 10.0075185C6.40729726 10.1192897 10.7317073 8.06157255 13.6585366 8.06157255 16.5853659 8.06157255 17.8515516 11.008362 21.4634146 9.15581453" transform="translate(3.907 17.514)"/>
                <path class="path d1" vector-effect="non-scaling-stroke" d="M-6.39266418e-13 10.6121443C1.75290468 7.58860245-.481866949 7.02566071.115226973 4.45115153.421190952 3.13129254 1.48780608 1.48786587 2.18931248.27778877M.277146314 4.86486486C4.14053199 5.14265363 7.04008155.499932452 8.04297101-6.66133815e-15" transform="translate(17.328 8.757)"/>
                <g stroke="#6590ED" stroke-width="2" transform="translate(25.37)">
                    <path vector-effect="non-scaling-stroke" class="path d2" d="M-3.14415161e-13,16.9596191 C0.514027529,16.8822829 1.43547559,16.3511558 2.33626338,16.4904888 C4.11469946,16.765959 5.86916963,17.8422743 7.80792941,17.4140491 C9.48389055,17.0439858 10.9383736,16.0168845 12.6829268,15.5675676"/>
                    <path vector-effect="non-scaling-stroke" class="path d3" d="M6.82926829 17.5135135C6.84455233 17.5608822 8.34598441 17.9593361 8.57164875 18.1348787 9.40597747 18.7806249 9.44104086 19.7718836 10.4120269 20.3988216 11.326372 20.9888399 12.634506 21.0083447 13.6585366 21.4054054M7.88648265 8.75675676C7.5466711 8.44548027 7.59338719 1.35936271 8.7804878 7.99360578e-15"/>
                </g>
            </g>
        </svg>
        <svg v-else-if="element === 'meaning'" class="element meaning" xmlns="http://www.w3.org/2000/svg" width="42" height="36" viewBox="0 0 42 36">
            <path class="path" vector-effect="non-scaling-stroke" fill="none" stroke="#FF7866" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M26.7041607,32.4676435 C20.9673524,34.0703082 18.7120793,24.9157918 27.2,25.217529 C29.9215022,25.3142758 32,27.5871172 32.8,29.9567054 C34.5617997,35.17513 31.1483596,38.3854061 27.0807718,39.048493 C22.4421397,39.80467 15.2006909,38.0769746 15.2002758,29.4023705 C15.2,23.6378036 20.3704268,18.9389061 26.996641,18.89909 C36.5421921,18.8417319 40,25.217529 40.2565614,29.3216118 C40.4938509,33.117412 40.8,44.1742344 27.2,44.9640971 C14.4,45.4906723 8,40.2249208 8,29.1668427 C8,12.5797254 23.2,11 27.2,11 C31.2,11 48,11.7898627 48,29.1668427" transform="translate(-7 -10)"/>
        </svg>
        <svg v-else-if="element === 'relationships'" class="element relationships" xmlns="http://www.w3.org/2000/svg" width="39" height="42" viewBox="0 0 39 42">
            <g fill="none" fill-rule="evenodd" stroke="#9490B0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" transform="translate(2 1.178)">
                <path vector-effect="non-scaling-stroke" class="path d1" d="M35.874371,34.351703 C34.713319,40.0878378 18.2480616,43.0005306 12.8375568,33.8422947 C6.64205763,23.3553171 10.6404816,1.5077001 24.356678,4.9626552 C31.3984645,6.73640177 25.3746425,14.5323352 26.7630404,19.2317315 C28.3915017,24.7436852 37.1453874,28.0779378 35.874371,34.351703 Z"/>
                <path vector-effect="non-scaling-stroke" class="path" d="M0.290253649,4.41142771 C-1.25170394,8.51510034 3.82624276,11.7627979 4.36943236,15.4747757 C5.1742875,20.9816774 -0.234357991,29.2728826 7.0409907,32.4706823 C18.4009703,37.4638366 21.6346848,14.3404456 19.2761906,7.61823771 C18.0251022,4.05302893 14.846928,0.972130686 10.5820772,0.17883273 C6.3172264,-0.614465225 1.45723519,1.30916733 0.290253649,4.41142771 Z"/>
            </g>
        </svg>
        <svg v-else-if="element === 'emotions'" class="element emotions" xmlns="http://www.w3.org/2000/svg" width="42" height="36" viewBox="0 0 42 36">
            <path class="path" vector-effect="non-scaling-stroke" fill="none" stroke="#33CCAB" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.6036021,10.9932832 C12.3106486,18.8843727 28.9515983,31.4670116 29.9401092,38.5779763 C30.7874042,44.6647465 20.5845906,50.4519323 17.2254031,46.9286432 C16.4193481,46.0841319 16.1719079,45.0809004 16.1719079,43.8650437 C16.1719079,38.7141238 22.4363016,35.98456 25.5774144,36.5939737 C34.0292387,38.2337296 39.0836167,47.7998811 42.0444753,36.1440871 C46.2681088,19.5172201 16.9511569,39.9103339 11.4234067,28.5434715 C9.12384595,23.8148225 16.6137089,14.0349312 23.6844565,20.1182271 C32.0581931,27.3225455 34.7956313,0.854456739 43.9364441,15.8581438 C48.1262006,22.7351904 38.8360585,28.2292883 35.1298586,21.8961796 C28.3267513,10.2711139 18.5816318,3.8568634 15.6036021,10.9932832 Z" transform="rotate(90 29.5 19.5)"/>
        </svg>
        <svg v-else class="element energy" xmlns="http://www.w3.org/2000/svg" width="47" height="35" viewBox="0 0 47 35">
            <path class="path" vector-effect="non-scaling-stroke" fill="none" stroke="#FF99B2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.07718848,33.0659031 C16.9034833,54.199668 20.7179299,20.251021 15.8579151,21.0429343 C10.9979002,21.8348476 13.8625604,37.5930451 19.6773127,37.9894412 C27.6775161,38.5348211 28.0221585,13.1185703 24.5423886,12.1275006 C19.4091615,10.6655114 24.3895721,41.7614486 30.3431156,42.9097293 C36.3335467,44.0651857 38.3505895,18.5270842 34.1893654,16.9067124 C29.4631525,15.0663352 32.4072958,35.8238194 37.147521,38.1746579 C44.9090376,42.0239099 46.864989,20.9520616 43.4838166,19.9890733 C38.3505895,18.5270842 43.573142,45.2571484 50.0771885,28.1235674" transform="rotate(9 89.608 -2.9)"/>
        </svg>
    </div>

</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Prop } from "vue-property-decorator";
    import { CactusElement } from "@shared/models/CactusElement";

    @Component
    export default class ElementAnimation extends Vue {
        name = "ElementAnimation.vue";

        @Prop({ type: String as () => CactusElement, required: false, default: null })
        element!: CactusElement | null;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    .element-animation {
        margin-bottom: .8rem;

        @include r(600) {
            margin-bottom: 2.4rem;
        }

        .element {
            display: block;
            height: auto;
            max-width: 12rem;
            width: 24vw;
        }

        .path {
            stroke-dasharray: 700;
            stroke-dashoffset: 700;
            animation: dash 35s ease-out .5s forwards;
        }

        .experience .path {
            animation-duration: 60s;
            stroke-dasharray: 275;
            stroke-dashoffset: 275;

            &.d0 {
                animation-delay: 9s;
            }

            &.d2 {
                animation-delay: 24s;
            }

            &.d3 {
                animation-delay: 33s;
            }
        }

        .relationships .path {
            animation-duration: 60s;
        }

        .d1 {
            animation-delay: 17s;
        }
    }

</style>