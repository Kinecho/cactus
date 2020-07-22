import {
    hierarchy as d3Hierarchy,
    pack as d3Pack,
    range as d3Range,
    scaleOrdinal as d3ScaleOrdinal,
    select as d3Select,
} from "d3";
import { HierarchyCircularNode } from "d3-hierarchy";
import Logger from "@shared/Logger"
import { getRandomNumberBetween, isBlank } from "@shared/util/StringUtil";
import { InsightWord } from "@shared/api/InsightLanguageTypes";

const logger = new Logger("wordBubbles");

export interface WordBubbleConfig {
    maxDiameter: number;
    colorRange: string[];
    selectable: boolean,
    selectedFillColor: string,
    hoverFillColor?: string | undefined,
    numFillerBubbles: number,
    wordClicked?: (word: InsightWord, selected: boolean,) => void,
}

export const DEFAULT_WORD_BUBBLE_CONFIG = (): WordBubbleConfig => {
    return {
        maxDiameter: 375,
        selectable: false,
        selectedFillColor: "#33CCAB",
        numFillerBubbles: 11,
        // hoverFillColor: "#00cee5",
        colorRange: [
            "#47445E",
            "#5E5A7C",
            "#9490B0",
            "#D3D1E3",
            "#D3D1E3",
        ],
    };
}

/**
 *
 * @param {number} count - number of bubbles to create
 * @param {number} [min=0.1] - minimum value to use for generating a random frequency/salience (both will be random)
 * @param {number} [max=0.5] - maximum value to use for generating a random frequency/salience (both will be random)
 * @return {InsightWord[]}
 */
const createExtraBubbles = (count: number, min: number = 0.1, max: number = 1): InsightWord[] => {
    const words: InsightWord[] = []
    for (let i = 0; i < count; i++) {
        const frequency = getRandomNumberBetween(min, max, 1);
        // const salience = getRandomNumberBetween(min, max, 1);
        words.push({ word: "", frequency });
    }
    return words;
}

interface BubbleData extends InsightWord {
    selected?: boolean;
    originalValue: number;
}

type Datum = { children: BubbleData[] };
type BubbleNode = Datum | BubbleData;


function isBubbleData(d: BubbleNode): d is BubbleData {
    return !(d as Datum).children && (d as BubbleData).word !== undefined
}

export function drawWordBubbleChart(parentSelector: string, words: InsightWord[], options?: Partial<WordBubbleConfig>) {
    const config: WordBubbleConfig = Object.assign(DEFAULT_WORD_BUBBLE_CONFIG(), options);
    const { maxDiameter, colorRange, selectable } = config;
    const color = d3ScaleOrdinal<number, string>().range(colorRange.reverse()).domain(d3Range(0, colorRange.length));

    const bubble = d3Pack()
    .size([maxDiameter, maxDiameter]) //[width, height]
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

    const extras = createExtraBubbles(config.numFillerBubbles);
    const dataset: BubbleData[] = words.slice(0, 7).concat(extras).map(d => ({
        ...d,
        selected: false,
        originalValue: d.frequency ?? 0
    }));

    //Sets up a hierarchy of data object
    const root = d3Hierarchy({ children: dataset })
    .sum((d: BubbleNode) => {
        let t = 0;
        if (isBubbleData(d)) {
            const min = !isBlank(d.word) ? 2 : 0
            // never take a value greater than six, to control colors
            const freq = d.frequency ?? 0;
            const salience = d.salience ?? 0;
            const score = freq + salience;
            t = Math.min(Math.max(min, score), colorRange.length - 1);
        }
        return t;

    })
    .sort((a, b) => {
        return (b.value ?? 0) - (a.value ?? 0);
    }) as HierarchyCircularNode<BubbleNode>;

    //Once we have hierarchal data, run bubble generator
    bubble(root);

    //setup the chart
    const bubbles = svg.selectAll<SVGElement, HierarchyCircularNode<BubbleData>>(".bubble")
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
        return color(Math.round(d.value ?? 0));
    }).on("mouseover", function (d) {
        if (isBubbleData(d.data) && selectable) {
            if (!isBlank(d.data.word)) {
                const selection = d3Select(this as any)
                const originalRadius = d.r;

                selection.style("cursor", "pointer");
                if (config.hoverFillColor) {
                    selection.style("fill", config.hoverFillColor)
                }

                if (!d.data.selected) {
                    selection.transition().duration(300).attr("r", function () {
                        return originalRadius * 1.05;
                    })
                }
            }
        }
    })
    .on("mouseout", function (d) {
        if (isBubbleData(d.data) && selectable) {
            if (!isBlank(d.data.word) && !d.data.selected) {
                const radius = d.r;
                d3Select(this as any).style("fill", color(d.value ?? 0))
                .transition().duration(300).attr("r", function () {
                    return radius;
                });
            }
        }
    })
    .on("click", function (d) {
        if (!selectable) {
            return;
        }
        if (!isBubbleData(d.data) || isBlank(d.data.word)) {
            return;
        }

        const data = d.data;
        const radius = d.r;
        if (isBubbleData(data)) {
            const selected = !data.selected;
            logger.info("Data is selected = ", selected);
            config.wordClicked?.(data, selected);
            const selection = d3Select(this)
            logger.info("selection", selection);

            parent.selectAll<SVGElement, HierarchyCircularNode<BubbleData>>("circle").style("fill", function (v) {
                v.data.selected = false;
                return color(v.value ?? 0)
            }).each(function (e) {
                const r = e.r;
                d3Select(this).transition().attr("r", r);
            })
            data.selected = selected;
            const newColor = selected && config.selectedFillColor ? config.selectedFillColor : color(d.value ?? 0);

            selection.style("fill", newColor)
            selection.transition().duration(200).attr("r", function () {
                return radius * 1.2;
            })
        }

    });

    //format the text for each bubble
    bubbles.append("text")
    .attr("x", (d) => {
        return d.x;
    })
    .attr("y", (d) => {
        return d.y + 2.5;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((d) => {
        if (isBubbleData(d.data)) {
            return d.data.word
        }
        return " "
    })
    // Note: This one needs to have the anonymous function
    // syntax because we need the "this" context that gets lost with the arrow syntax
    .style("font-size", function (d) {
        if (!isBubbleData(d.data)) {
            return "0";
        }
        const len = d.data.word.substring(0, d.r / 3).length;
        let size = d.r / 3;
        size *= 9 / len;
        size += 1;
        return Math.round(size) + 'px'
    })
    .style("pointer-events", "none")
    .style("fill", "#FFF")
    .style("cursor", "pointer")
    .append("title")
    .text(d => {
        if (isBubbleData(d.data)) {
            return d.data.word
        }
        return " "
    });
}
