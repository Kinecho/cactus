// tslint:disable-next-line:no-implicit-dependencies
import Vue from "vue";
import InsightWordChart from "@components/InsightWordChart.vue";
// import Page from "@components/YOUR_PAGE"
import {commonInit} from "@web/common";
import Logger from "@shared/Logger";
import {InsightWord} from "@shared/models/ReflectionResponse";

const logger = new Logger("insights_embed");
commonInit();

class InsightDataSource {
    _words: InsightWord[] = [];
    _delegate?: InsightDataSourceDelegate | undefined;

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
        this.delegate?.onData(this._words);
    }
}

interface InsightDataSourceDelegate {
    onData: (words: InsightWord[]) => void
}


const dataSource = new InsightDataSource();
dataSource.words = [
    {word: "One", frequency: 1.5},
    {word: "Shadow", frequency: .5},
    {word: "Dog", frequency: 2.3},
    {word: "Christina", frequency: .3},
    {word: "Neil", frequency: .3},
    {word: "Hockey", frequency: .1},
    {word: "Chips", frequency: .1},
    {word: "Salsa", frequency: .1},
    {word: "Laura", frequency: .1},
    {word: "Max", frequency: .1},
];


window.setInsightWords = (words: any) => {
    console.log("Setting words ", words);
    if (words && Array.isArray(words)) {
        dataSource.words = words

    } else {
        console.warn("An array was not passed");
    }
};

new Vue({
    el: "#app",
    template: `
            <WordChart :words="dataSource.words"/>
        `,
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
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}