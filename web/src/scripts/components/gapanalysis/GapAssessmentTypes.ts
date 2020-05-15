export type ScreenName = "intro"
| "questions"
| "pendingResults"
| "results"
| "choose-focus"
| "upgrade"

/**
 * Screen Names
 * @type {{upgrade: string, intro: string, pendingResults: string, questions: string, chooseFocus: string, results: string}}
 */
export const Screen: { [key: string]: ScreenName } = {
    intro: "intro",
    questions: "questions",
    pendingResults: "pendingResults",
    results: "results",
    chooseFocus: "choose-focus",
    upgrade: "upgrade"
}

/**
 * Screen Order
 * @type {(string)[]}
 */
export const defaultScreens: ScreenName[] = [
    Screen.intro,
    Screen.questions,
    Screen.pendingResults,
    Screen.results,
    Screen.chooseFocus,
    Screen.upgrade
];
