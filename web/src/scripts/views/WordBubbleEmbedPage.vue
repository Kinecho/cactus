<template>
    <div class="container" :style="{ display: 'flex', flex: 1, justifyItems: 'stretch', alignItems: 'stretch' }">
        <transition name="fade-in">
            <WordChart :words="dataSource.words" style="flex: 1" :blurry="dataSource.blurred" v-if="dataSource.loaded"/>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Logger from "@shared/Logger";
    import InsightWordChart from "@components/InsightWordChart.vue";
    import { getQueryParam } from "@web/util";
    import { QueryParam } from "@shared/util/queryParams";
    import { fireRevealInsightEvent } from "@web/analytics";
    import { InsightWord } from "@shared/api/InsightLanguageTypes";

    const logger = new Logger("WordBubbleEmbedPage");

    /**
     * Set up window functions for app interface
     */
    const dataParam = getQueryParam(QueryParam.CHART_DATA);
    const initialWords: InsightWord[] = dataParam ? JSON.parse(atob(dataParam)) : [];
    console.log("initial words", initialWords);

    class InsightDataSource {
        _words: InsightWord[] = [];
        _delegate?: InsightDataSourceDelegate | undefined;
        blurred: boolean = true;
        loaded: boolean = false;

        set delegate(delegate: InsightDataSourceDelegate | undefined) {
            this._delegate = delegate;
            this.delegate?.onData(this.words);
        }

        get delegate(): InsightDataSourceDelegate | undefined {
            return this._delegate
        }

        get words(): InsightWord[] {
            return this._words
        }

        set words(words: InsightWord[]) {
            this._words = words || [];
            this.loaded = true;
            this.delegate?.onData(this._words);
        }
    }

    interface InsightDataSourceDelegate {
        onData: (words: InsightWord[]) => void
    }


    const dataSource = new InsightDataSource();
    if (initialWords && initialWords.length) {
        dataSource.words = initialWords
    }


    window.fireShowMeAnalyticsEvent = () => {
        fireRevealInsightEvent()
    };

    window.unlockInsights = () => {
        dataSource.blurred = false;
        window.fireShowMeAnalyticsEvent()
    };

    window.lockInsights = () => {
        dataSource.blurred = true;
    };

    window.setInsightWords = (words: any) => {
        console.log("Setting words ", words);
        if (words && Array.isArray(words)) {
            dataSource.words = words

        } else {
            console.warn("An array was not passed");
        }
    };

    window.setInsightWordsBase64 = (base64: string | undefined | null) => {
        if (!base64) {
            return
        }

        const decoded = atob(base64);
        const words = JSON.parse(decoded) as InsightWord[];
        logger.info("Decoded base64 string into words array", words);
        if (words && Array.isArray(words)) {
            dataSource.words = words;
        }
    };


    /**
     * END window app functions
     */


    export default Vue.extend({
        name: "InsightsEmbedPage",
        components: {
            WordChart: InsightWordChart,
        },
        data(): { dataSource: InsightDataSource } {
            return {
                dataSource,
            }
        },
        beforeMount() {
            dataSource.delegate = {
                onData: (words) => {
                    logger.info("Fetched words from data source", words);
                }
            }
        },
    })
</script>

<style lang="scss">
    body, html {
        background: transparent;
    }
</style>