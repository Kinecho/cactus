import FlamelinkModel, { SchemaName } from "@shared/FlamelinkModel";
import { ExperimentType, RedirectExperiment, Variant } from "@shared/models/ExperimentTypes";
import { timestampToDate } from "@shared/util/FirestoreUtil";
import { getFlamelinkDateStringInDenver } from "@shared/util/DateUtil";

export enum ExperimentFields {
    type = "type",
    name = "name",
    startsAt = "startsAt",
    endsAt = "endsAt",
    redirects = "redirects"
}

export default class Experiment extends FlamelinkModel {
    readonly schema = SchemaName.experiments;
    type: ExperimentType = ExperimentType.redirect;
    name!: string;
    startsAt?: Date|null;
    endsAt?: Date|null;
    redirects?: RedirectExperiment;

    constructor(data?: Partial<Experiment>) {
        super(data);
        if (data) {
            Object.assign(this, data);

            this.startsAt = data.startsAt ?  timestampToDate(data.startsAt) || new Date(data.startsAt) : null;
            this.endsAt = data.endsAt ?  timestampToDate(data.endsAt) || new Date(data.endsAt) : null;
        }
    }

    prepareForFirestore(): any {
        const data = super.prepareForFirestore();
        data[ExperimentFields.startsAt] = this.startsAt ? getFlamelinkDateStringInDenver(this.startsAt) : null
        data[ExperimentFields.endsAt] = this.endsAt ? getFlamelinkDateStringInDenver(this.endsAt) : null
        return data;
    }

    isValidVariant(variant: string|null): boolean {
        if (!variant) {
            return false;
        }

        let variants: Variant[] = [];
        switch (this.type) {
            case ExperimentType.redirect:
                variants = this.redirects?.variants ?? [];
                break;
            default:
                break;
        }

        return variants.some(v => v.name === variant)
    }
}