import {
    hierarchy as d3Hierarchy,
    pack as d3Pack,
    scaleOrdinal as d3ScaleOrdinal,
    select as d3Select,
    selectAll,
    scaleSqrt,
} from "d3";
import { HierarchyCircularNode } from "d3-hierarchy";
import { InsightWord } from "@shared/models/ReflectionResponse";
import Logger from "@shared/Logger"
import { isBlank } from "@shared/util/StringUtil";

const logger = new Logger("wordBubbles");

export interface WordBubbleConfig {
    maxDiameter: number;
    colorRange: string[];
    selectable: boolean,
    selectedFillColor: string,
    hoverFillColor?: string | undefined,
    wordClicked?: (word: InsightWord, selected: boolean,) => void,
}

export const DEFAULT_WORD_BUBBLE_CONFIG = (): WordBubbleConfig => {
    return {
        maxDiameter: 375,
        selectable: false,
        selectedFillColor: "#0DADB1",
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
    const dataset: BubbleData[] = words.slice(0, 7).concat(extras).map(d => ({
        ...d,
        selected: false,
        originalValue: d.frequency ?? 0
    }));
    logger.info("dataset", dataset);

    const radiusScale = scaleSqrt().domain([0, 100]).range([10, 50]);

    //Sets up a hierarchy of data object
    const root = d3Hierarchy({ children: dataset })
    .sum((d: BubbleNode) => {
        let t = 0;
        if (isBubbleData(d)) {
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
        const fillColor = color(`${ d.value ?? 0 }`);
        return fillColor as string;
    }).on("mouseover", function (d) {
        if (isBubbleData(d.data)) {
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
        if (isBubbleData(d.data)) {
            if (!isBlank(d.data.word) && !d.data.selected) {
                const radius = d.r;
                d3Select(this as any).style("fill", color(`${ d.value ?? 0 }`) as string)
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
            // parent.select("circle").each(c => c.style("fill", color(`${ c.data.value ?? 0 }`) as string))
            logger.info("Data is selected = ", selected);
            config.wordClicked?.(data, selected);
            const selection = d3Select(this as any)
            logger.info("selection", selection);

            parent.selectAll("circle").style("fill", function (v) {
                v.data.selected = false;
                return color(`${ v.value ?? 0 }`) as string
            }).each(function (e) {
                const r = e.r;
                d3Select(this as any).transition().attr("r", r);
            })
            data.selected = selected;
            const newColor = selected && config.selectedFillColor ? config.selectedFillColor : color(`${ d.value ?? 0 }`) as string;

            selection.style("fill", newColor)
            selection.transition().duration(200).attr("r", function () {
                return radius * 1.15;
            })
        }

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
        if (isBubbleData(d.data)) {
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
    .style("cursor", "pointer")
    .append("title")
    .text(d => {
        if (isBubbleData(d.data)) {
            return d.data.word
        }
        return " "
    });
}