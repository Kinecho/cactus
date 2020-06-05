import {
    hierarchy as d3Hierarchy,
    pack as d3Pack,
    scaleOrdinal as d3ScaleOrdinal,
    select as d3Select
} from "d3";
import { HierarchyCircularNode } from "d3-hierarchy";
import { InsightWord } from "@shared/models/ReflectionResponse";
import Logger from "@shared/Logger"

const logger = new Logger("wordBubbles");

export interface WordBubbleConfig {
    maxDiameter: number;
    colorRange: string[];
}

export const DEFAULT_WORD_BUBBLE_CONFIG = (): WordBubbleConfig => {
    return {
        maxDiameter: 375,
        colorRange: [
            "#47445E",
            "#5E5A7C",
            "#9490B0",
            "#D3D1E3",
            "#D3D1E3",
        ],
    };
}

const createExtraBubbles = (): InsightWord[] => {
    return [
        { word: "", frequency: .5, salience: .5 },
        { word: "", frequency: .5, salience: .5 },
        { word: "", frequency: .5, salience: .5 },
        { word: "", frequency: .5, salience: .5 },
        { word: "", frequency: .3, salience: .3 },
        { word: "", frequency: .3, salience: .3 },
        { word: "", frequency: .3, salience: .3 },
        { word: "", frequency: .3, salience: .3 },
        { word: "", frequency: .1, salience: .1 },
        { word: "", frequency: .1, salience: .1 },
        { word: "", frequency: .1, salience: .1 },
        { word: "", frequency: .1, salience: .1 },
    ];
}

type Datum = { children: InsightWord[] };
type BubbleNode = Datum | InsightWord;


function isInsightWord(d: BubbleNode): d is InsightWord {
    return !(d as Datum).children && (d as InsightWord).word !== undefined
}

export function drawWordBubbleChart(parentSelector: string, words: InsightWord[], options?: Partial<WordBubbleConfig>) {
    const config: WordBubbleConfig = Object.assign(DEFAULT_WORD_BUBBLE_CONFIG(), options);
    const { maxDiameter, colorRange } = config;
    const color = d3ScaleOrdinal().range(colorRange);

    const bubble = d3Pack()
    .size([maxDiameter, maxDiameter])
    .padding(20);

    const parent = d3Select(parentSelector);
    //reset any existing graphics
    parent.select("svg").remove().remove();

    const svg = d3Select(".bubble-chart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMinYMid")
    .attr("viewBox", "0 0 375 375")
    .style("display", "block");

    const extras = createExtraBubbles();
    const dataset = words.slice(0, 7).concat(extras);
    logger.info("dataset", dataset);

    //Sets up a hierarchy of data object
    const root = d3Hierarchy({ children: dataset })
    .sum((d: BubbleNode) => {
        let t = 0;
        if (isInsightWord(d)) {
            // never take a value greater than six, to control colors
            t = Math.min(Math.max(d.frequency || 1, d.salience || 0), 6) ?? 0
        }
        return t;

    })
    .sort((a, b) => {
        return (b.value ?? 0) - (a.value ?? 0);
    }) as HierarchyCircularNode<BubbleNode>;

    //Once we have hierarchal data, run bubble generator
    bubble(root);

    //setup the chart
    const bubbles = svg.selectAll(".bubble")
    .data(root.children!)
    .enter();

    //create the bubbles
    bubbles.append("circle")
    .attr("class", "circle")
    .attr("r", (d) => {
        return d.r;
    })
    .attr("cx", (d) => {
        return d.x;
    })
    .attr("cy", (d) => {
        return d.y;
    })
    .style("fill", (d) => {
        let fillColor = color(`${ d.value ?? 0 }`);
        return fillColor as string;
    });

    //format the text for each bubble
    bubbles.append("text")
    .attr("x", (d) => {
        return d.x;
    })
    .attr("y", (d) => {
        return d.y + 5;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((d) => {
        if (isInsightWord(d.data)) {
            return d.data.word
        }
        return " "
    })
    // Note: This one needs to have the anonymous function
    // syntax because we need the "this" context that gets lost with the arrow syntax
    .style("font-size", function (d) {
        return Math.min(2 * d.r, (2 * d.r - 8) / (this as SVGTextElement).getComputedTextLength() * 14) + "px";
    })
    .style("fill", "#FFF")
    .append("title")
    .text(d => {
        if (isInsightWord(d.data)) {
            return d.data.word
        }
        return " "
    });

}