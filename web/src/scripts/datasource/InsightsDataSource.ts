import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger"
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import { DateTime } from "luxon";
import Vue from "vue";
import { BarChartDataPoint } from "@shared/charts/StackedBarChartTypes";
import { getDatesBetween } from "@shared/util/DateUtil";
import { TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
import { PromptType } from "@shared/models/ReflectionPrompt";
import { ChartDataResult } from "@shared/charts/ChartTypes";
import { stringifyJSON } from "@shared/util/ObjectUtil";

const logger = new Logger("InsightsDataSource");


export default class InsightsDataSource {
    /**
     * Create an observable instance of this data source so it can be used directly as a reactive property in a Vue component.
     */
    static shared: InsightsDataSource = Vue.observable(new InsightsDataSource());
    private member: CactusMember | null = null;
    reflectionsObserver: ListenerUnsubscriber | null = null;
    emotionsChartDays = 14;
    positivityChartDays = 14;
    loading: boolean = false
    reflections_l30: ReflectionResponse[] = [];
    reflections_l14: ReflectionResponse[] = [];

    /**
     * Update the member. This method should be called anytime the current member changes.
     * This method will handle deciding if it needs to update the observable queries, so is safe to run frequently.
     * @param {CactusMember | null} member
     */
    setMember(member: CactusMember | null) {
        const previousId = this.member?.id;
        const currentId = member?.id;
        this.member = member;
        logger.info("setting member")
        if (currentId && currentId !== previousId) {
            this.fetch().catch(error => logger.error(error))
        } else if (!currentId) {
            logger.info("No current member id, stopping queries")
            this.stop();
            this.member = null;
        }
    }

    async fetch(): Promise<void> {
        logger.info("Fetching data")
        this.loading = true;
        this.stop(); //clear existing data & stop observers

        const memberId = this.member?.id;
        if (!memberId) {
            logger.info("No member id, can't fetch data")
            this.loading = false;
            return;
        }

        this.reflectionsObserver = ReflectionResponseService.sharedInstance.observeAllSince({
            daysAgo: 30,
            onData: (responses) => this.onReflections(responses),
            memberId,
        });
    }

    private onReflections(reflections: ReflectionResponse[]) {
        logger.info("Handling reflection data")
        this.reflections_l30 = reflections;
        const l14: ReflectionResponse[] = [];
        if (reflections.length > 0) {
            let index = 0
            let last: ReflectionResponse = reflections[index];

            while (last?.createdAt && DateTime.fromJSDate(last.createdAt).diffNow("days").as("days") < 14) {
                l14.push(last)
                index++;
                last = reflections[index];
            }
        }

        this.reflections_l14 = l14;
        logger.info("l14.count =", l14.length)
        logger.info("l30.count =", this.reflections_l30.length)
        this.loading = false;
    }

    stop() {
        logger.info("Stopping queries")
        this.reflectionsObserver?.();
        this.reflections_l14 = [];
        this.reflections_l30 = [];
    }

    getPositivityChartData(reflections: ReflectionResponse[]): ChartDataResult<TimeSeriesDataPoint> {
        const rangeStart = DateTime.local().minus({ days: this.positivityChartDays })
        const data: TimeSeriesDataPoint[] = [];

        let lastPoint: TimeSeriesDataPoint | null = null;
        let dayGroup: ReflectionResponse[] = []
        reflections.forEach(r => {
            const sentiment = r.sentiment?.documentSentiment;
            if (!sentiment?.score || !r.createdAt) {
                return;
            }
            const rDt = DateTime.fromJSDate(r.createdAt).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            const score = (sentiment.score + 1) / 2;
            const point = { value: score, date: r.createdAt, label: "" }

            if (lastPoint?.date && DateTime.fromJSDate(lastPoint.date)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .diff(rDt).as("days") === 0) {
                dayGroup.push(r);

                // if the date is the same, we want to take the cactus score (averaged)
                // or the total score (averaged) if there was no cactus score
                const { cactusCt, cactusScore, totalCount, totalScore } = dayGroup.reduce((total, g) => {
                    total.totalCount++;
                    total.totalScore += g.sentiment?.documentSentiment?.score ?? 0;
                    const isCactus = g.promptType === PromptType.CACTUS;
                    total.cactusCt += isCactus ? 1 : 0;
                    total.cactusScore += isCactus ? g.sentiment?.documentSentiment?.score ?? 0 : 0

                    return total;
                }, { cactusCt: 0, cactusScore: 0, totalScore: 0, totalCount: 0 });

                lastPoint.value = cactusCt > 0 ? cactusScore / Math.max(cactusCt, 1) : totalScore / Math.max(totalCount, 1)
                return;
            }

            data.push(point);
            lastPoint = point;
            dayGroup = [r];
        })

        const nonEmptyCount = data.length;
        logger.info("Positivity initial data", { ...data });
        const tomorrow = DateTime.local().plus({ days: 1 }).toJSDate()
        if (nonEmptyCount === 0) {
            logger.info("positivity: Filling with empty data");
            getDatesBetween(rangeStart.toJSDate(), tomorrow).forEach(d => {
                logger.info("positivity: adding date to the end of the series", d)
                data.push({ value: null, date: d, label: "" })
            })
        } else {

            const [first] = data;
            const last = data[data.length - 1];
            logger.info("Positivity: original data series", JSON.stringify(data));
            logger.info("Positivity: first.date", first.date)
            logger.info("Positivity: last.date", last.date);
            const startFiller = getDatesBetween(rangeStart.toJSDate(), first.date)
            logger.info("Positivity: start filler dates", startFiller)
            startFiller.reverse().forEach(d => {
                logger.info("Positivity: adding date to beginning of series", d)
                data.unshift({ value: null, date: d, label: "" })
            })

            getDatesBetween(last.date, tomorrow).forEach(d => {
                logger.info("Positivity: adding date to the end of the series", d)
                data.push({ value: null, date: d, label: "" })
            })
        }

        logger.info("Positivity filled data", data);
        return { data, nonEmptyCount };
    }

    /**
     * Create chart data using the last 14 days of data.
     * If there are missing days in the range of Today - interval 14 days, they will be filled in as blank
     * @return {BarChartDataPoint<Date>[]}
     */
    getEmotionsChartData(reflections: ReflectionResponse[]): ChartDataResult<BarChartDataPoint<Date>> {
        const rangeStart = DateTime.local().minus({ days: this.emotionsChartDays })
        const data: BarChartDataPoint<Date>[] = [];
        let lastReflection: ReflectionResponse | null = null;
        reflections.forEach(r => {
            const documentTone = r.toneAnalysis?.documentTone
            if (!documentTone || !r.createdAt) {
                return;
            }

            const rDt = DateTime.fromJSDate(r.createdAt);
            if (rDt.diff(rangeStart).as("days") < 0) {
                return;
            }

            if (lastReflection?.createdAt && DateTime.fromJSDate(lastReflection.createdAt).diff(rDt).as("days") === 0) {
                return;
            }

            const tones = documentTone.tones ?? [];
            if (tones.length === 0) {
                // lastReflection = r;
                return;
            }

            const series: Record<string, number> = {};
            tones.reduce((total, score) => {
                total[score.toneName] = score.score
                return total;
            }, series)

            if (Object.keys(series).length > 0) {
                data.push({
                    x: r.createdAt,
                    series,
                });
                lastReflection = r;
            }
        })
        const dataCount = data.length;
        const tomorrow = DateTime.local().plus({ days: 1 }).toJSDate()
        if (data.length === 0) {
            logger.info("Filling with empty data");
            getDatesBetween(rangeStart.toJSDate(), tomorrow).forEach(d => {
                logger.info("adding date to the end of the series", d)
                data.push({ x: d, series: {} })
            })
        } else {

            const [first] = data;
            const last = data[data.length - 1];
            logger.info("original data series", JSON.stringify(data));
            logger.info("first.x", first.x)
            logger.info("last.x", last.x);
            const startFiller = getDatesBetween(rangeStart.toJSDate(), first.x)
            logger.info("start filler dates", startFiller)
            startFiller.reverse().forEach(d => {
                logger.info("adding date to beginning of series", d)
                data.unshift({ x: d, series: {} })
            })

            getDatesBetween(last.x, tomorrow).forEach(d => {
                logger.info("adding date to the end of the series", d)
                data.push({ x: d, series: {} })
            })
        }
        logger.info("Emotions chart data", data);
        return { data, nonEmptyCount: dataCount }
    }
}

window.insights = InsightsDataSource.shared