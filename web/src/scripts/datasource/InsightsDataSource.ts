import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger"
import { ListenerUnsubscriber } from "@web/services/FirestoreService";
import ReflectionResponseService from "@web/services/ReflectionResponseService";
import { DateTime } from "luxon";
import Vue from "vue";
import { BarChartDataPoint } from "@shared/charts/StackedBarChartTypes";

const logger = new Logger("InsightsDataSource");


export default class InsightsDataSource {
    /**
     * Create an observable instance of this data source so it can be used directly as a reactive property in a Vue component.
     */
    static shared: InsightsDataSource = Vue.observable(new InsightsDataSource());
    private member: CactusMember | null = null;
    reflectionsObserver: ListenerUnsubscriber | null = null;

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

    get emotionsChartData(): BarChartDataPoint<Date>[] {
        const data: BarChartDataPoint<Date>[] = [];
        this.reflections_l14.forEach(r => {
            const documentTone = r.toneAnalysis?.documentTone
            if (!documentTone) {
                return;
            }
            const series: Record<string, number> = {};

            (documentTone.tones ?? []).reduce((total, score) => {
                total[score.toneName] = score.score
                return total;

            }, series)

            data.push({
                x: r.createdAt!,
                series,
            })
        })

        return data
    }
}

window.insights = InsightsDataSource.shared