export interface MilestoneConfig {
    unlockedAfterReflectionCount: number,
}

export enum MilestoneID {
    emotions_analysis = "emotions_analysis",
    positivity_analysis = "positivity_analysis",
}

export const Milestones: {[id in MilestoneID]: MilestoneConfig} = {
    [MilestoneID.emotions_analysis]: {
        unlockedAfterReflectionCount: 7
    },
    [MilestoneID.positivity_analysis]: {
        unlockedAfterReflectionCount: 3
    }
}