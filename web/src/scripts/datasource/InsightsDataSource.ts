import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger"
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import { DateTime } from "luxon";
import Vue from "vue";
import { BarChartDataPoint } from "@shared/charts/StackedBarChartTypes";
import { getDatesBetween } from "@shared/util/DateUtil";

const logger = new Logger("InsightsDataSource");


export default class InsightsDataSource {
    /**
     * Create an observable instance of this data source so it can be used directly as a reactive property in a Vue component.
     */
    static shared: InsightsDataSource = Vue.observable(new InsightsDataSource());
    private member: CactusMember | null = null;
    reflectionsObserver: ListenerUnsubscriber | null = null;
    emotionsChartDays = 14;
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

    /**
     * Create chart data using the last 14 days of data.
     * If there are missing days in the range of Today - interval 14 days, they will be filled in as blank
     * @return {BarChartDataPoint<Date>[]}
     */
    get emotionsChartData(): BarChartDataPoint<Date>[] {
        const rangeStart = DateTime.local().minus({ days: this.emotionsChartDays })
        const data: BarChartDataPoint<Date>[] = [];
        let lastReflection: ReflectionResponse | null = null;
        this.reflections_l30.forEach(r => {
            const documentTone = r.toneAnalysis?.documentTone
            if (!documentTone || !r.createdAt) {
                // lastReflection = r;
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

            // lastReflection = r;
        })

        if (data.length === 0) {
            logger.info("Filling with empty data");
            // const fillerDates = getDatesBetween(DateTime.local().minus({ days: 10 }).toJSDate(), new Date());
            // fillerDates.forEach(d => {
            //     data.push({ x: d, series: {} })
            // })
            return [];
        } else {
            const tomorrow = DateTime.local().plus({ days: 1 }).toJSDate()
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
        logger.info("Chart data", data);
        return data
    }
}

window.insights = InsightsDataSource.shared