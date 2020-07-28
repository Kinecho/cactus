import CactusMember from "@shared/models/CactusMember";
import Experiment from "@shared/models/Experiment";
import { getRandomNumberBetween, isBlank } from "@shared/util/StringUtil";
import StorageService, { LocalStorageKey } from "@web/services/StorageService";
import { ExperimentType, Variant } from "@shared/models/ExperimentTypes";
import Logger from "@shared/Logger"
import { MemberExperiments } from "@shared/models/CactusMemberTypes";

const logger = new Logger("ExperimentManager");

export type ExperimentVariant = string | null;

export default class ExperimentManager {
    static shared = new ExperimentManager();


    /**
     * Determine the variant for an experiment. This will not apply it, only determine it.
     * @param {{member?: CactusMember | null, experiment: Experiment}} options
     * @return {ExperimentVariant}
     */
    getVariantName(options: { member?: CactusMember | null, experiment: Experiment }): ExperimentVariant {
        const { experiment, member } = options;

        const name = experiment.name;
        let variant: ExperimentVariant = null;
        if (isBlank(name)) {
            return null;
        }

        if (member) {
            variant = this.getVariantFromMember({ member, experiment })
            if (variant) {
                return variant;
            }
        }
        variant = this.getVariantFromDevice(experiment);
        if (variant) {
            return variant;
        }

        variant = this.getRandomVariant(experiment)?.name ?? null;

        if (experiment.isValidVariant(variant)) {
            return variant;
        }
        return null;
    }

    getRandomVariant(experiment: Experiment): Variant | null {
        let variants: Variant[] = [];
        switch (experiment.type) {
            case ExperimentType.redirect:
                variants = experiment.redirects?.variants ?? [];
                break;
            default:
                return null;
        }

        if (variants.length === 0) {
            return null;
        }

        const index = getRandomNumberBetween(0, variants.length)
        return variants[index];
    }

    getVariantFromMember(options: { member: CactusMember, experiment: Experiment }): ExperimentVariant {
        const { member, experiment } = options;

        const memberExperiments = member.experiments;
        if (!memberExperiments) {
            return null;
        }
        const variant = memberExperiments[experiment.name];
        if (experiment.isValidVariant(variant)) {
            return variant;
        }
        return null;
    }

    getVariantFromDevice(experiment: Experiment): ExperimentVariant {
        const experiments = StorageService.getJSON(LocalStorageKey.experiments, {});
        const variant = experiments[experiment.name]
        if (experiment.isValidVariant(variant)) {
            return variant;
        }
        return null;
    }

    getDeviceExperiments(): Record<string, string | null> {
        return StorageService.getJSON(LocalStorageKey.experiments, {});
    }

    /**
     * Get current experiments from the device, and apply them to the member.
     * Will not overrwrite any existing experiments.
     * Does _not_ save the member
     * @param {CactusMember} member
     * @return {boolean} - hasChanges - if any changes were made
     */
    applyDeviceExperimentsToMember(member: CactusMember): boolean {
        const experiments = this.getDeviceExperiments();
        const memberExperiments: MemberExperiments = member.experiments ?? {}
        let changed = false;
        Object.keys(experiments).forEach(expName => {
            if (isBlank(memberExperiments[expName])) {
                memberExperiments[expName] = experiments[expName];
                member.experiments = memberExperiments;
                changed = true;
            }
        })

        return changed;
    }

    /**
     * Save a variant to local storage. Will not overwrite and variant by default, but can be overridden
     * @param {{experimentName: string, variant: string, overwrite: boolean}} options
     */
    persistVariantToDevice(options: { experimentName: string, variant: string, overwrite?: boolean }) {
        const { experimentName, variant, overwrite = false } = options;
        const experiments = this.getDeviceExperiments();
        const existingVariant = experiments[experimentName]
        if (!existingVariant || overwrite) {
            experiments[experimentName] = variant
            logger.info("Saving experiments to device", experiments)
            StorageService.saveJSON(LocalStorageKey.experiments, experiments)
        } else {
            logger.info("No changes to experiments, not saving. Current experiments are ", experiments)
        }
    }

    clearDeviceExperiments() {
        StorageService.removeItem(LocalStorageKey.experiments)
    }
}