<template>
    <div class="page-container">
        <div class="centered">
            <section class="hasApp">
                <h2>Continue on the app</h2>
                <p>Finish logging in to your {{sourceAppDescription}} app</p>
                <div class="actions">
                    <a :href="deepLink" class="button primary" title="Sign In To App">Open Cactus</a>
                </div>
            </section>
            <section class="needsApp" v-if="sourceApp">
                <h3>Need to install Cactus?</h3>
                <AppStoreIcon v-if="sourceApp == 'ios'" />
                <PlayStoreIcon v-if="sourceApp == 'android'" />
            </section>

        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Config} from '@web/config';
    import {getAllQueryParams, getQueryParam} from '@web/util';
    import {QueryParam} from "@shared/util/queryParams";
    import {appendQueryParams} from '@shared/util/StringUtil';
    import NavBar from "@components/NavBar.vue";
    import AppStoreIcon from "@components/AppStoreIcon.vue";
    import PlayStoreIcon from "@components/PlayStoreIcon.vue";
    import {SourceApp} from "@shared/api/SignupEndpointTypes";
    import Logger from "@shared/Logger";
    import CopyService from "@shared/copy/CopyService";

    const logger = new Logger("MagicLinkAppContinue.vue");
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            NavBar,
            AppStoreIcon,
            PlayStoreIcon
        },
        created() {
            logger.log("magic link app continue");
        },
        props: {
            link: {type: String, required: true}
        },
        computed: {
            deepLink(): string {
                const base = `${Config.appCustomScheme}://auth-actions`;
                let params = getAllQueryParams(self.link);
                return appendQueryParams(base, params);
            },
            sourceApp(): SourceApp | undefined {
                const param = getQueryParam(QueryParam.SOURCE_APP);
                if (param && param === SourceApp.android) {
                    return SourceApp.android;
                } else if (param === SourceApp.ios) {
                    return SourceApp.ios;
                } else {
                    return undefined;
                }
            },
            sourceAppDescription(): string | undefined {
                if (this.sourceApp === SourceApp.ios) {
                    return copy.common.IOS;
                } else if (this.sourceApp === SourceApp.android) {
                    return copy.common.ANDROID;
                } else {
                    return undefined;
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .page-container {
        min-height: 100vh;

        .centered {
            flex-grow: 1;
            max-width: 70rem;
            padding: 6.4rem 2.4rem;

            section {
                margin-bottom: 4rem;

                p {
                    opacity: .8;
                }

                &.hasApp {
                    padding: 4rem;
                    @include shadowbox;
                    color: $white;
                    background: $darkestGreen url(/assets/images/darkGreenNeedles.svg) 0 0/320px;

                }

                .actions {
                    padding: 4rem 0;
                }
            }

            .needsApp {
                text-align: center;
            }

            h3 {
                color: $magenta;
                margin-bottom: 1.6rem;
            }

            .play-store-icon {
                margin: 0 auto;
                display: inline-block;
            }
        }
    }
</style>
