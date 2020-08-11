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


export function getMilestoneText(days: number): { title: string, message: string } {
    switch (days) {
        case 1:
            return {
                title: "Well done",
                message: "Tomorrow you'll receive a new prompt to continue your journey of self-understanding.\n\nKeep it up and you'll soon see positive change."
            }
        case 2:
            return {
                title: "Nice work",
                message: "Just one more reflection to reveal your positivity insight.\n\nWe are excited to be your co-pilot on this journey of self-understanding"
            }
        case 3:
            return { title: "You did it", message: "You've reflected three times. Your positivity insight is ready." }
        case 4:
            return { title: "Great job", message: "You're more than halfway to your seven-day goal. Keep it up." }
        case 5:
            return { title: "Nice work", message: "You're almost there; just a couple more reflections." }
        case 6:
            return { title: "Well done", message: "You're one reflection away from unlocking your emotions insight." }
        case 7:
            return { title: "You did it", message: "You made your 7-day goal. It's time to reveal your new insight." }
        default:
            return {
                title: "Well done",
                message: "Tomorrow you'll receive a new prompt to continue your journey of self-understanding.\n\nKeep it up and you'll soon see positive change."
            }
    }
}