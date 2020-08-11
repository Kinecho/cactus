export interface Milestone {
    type: "check" | "flag"
}

export const defaultMilestones = (): Milestone[] => {
    return [
        { type: "check" },
        { type: "check" },
        { type: "flag" },
        { type: "check" },
        { type: "check" },
        { type: "check" },
        { type: "flag" },
    ];
}
