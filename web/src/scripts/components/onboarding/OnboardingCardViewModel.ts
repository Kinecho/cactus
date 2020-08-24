import { CactusElement } from "@shared/models/CactusElement";
import { ActionButton, ContentAction, LinkStyle, LinkTarget } from "@shared/models/PromptContent";
import AppSettings from "@shared/models/AppSettings";
import { CoreValue } from "@shared/models/CoreValueTypes";

export enum CardType {
    text = "text",
    streak = "streak",
    // photo = "photo",
    reflect = "reflect",
    elements = "elements",
    word_cloud = "word_cloud",
    upsell = "upsell",
    celebrate = "celebrate",
    insights = "insights",
    mini_core_values = "mini-core-values",
}

export enum TextReplacementType {
    selected_insight_word = "selected_insight_word",
    onboarding_core_value = "OB_CORE_VALUE"
}

export enum ComponentName {
    HomeDemoAnimation = "HomeDemoAnimation",
}

export interface LinkableActionButton extends ActionButton {
    href?: string;
    target?: LinkTarget;
}

export default class OnboardingCardViewModel {
    id!: string;
    type: CardType = CardType.text;
    slug?: string;
    /**
     * Markdown enabled text
     */
    text?: string;
    componentName?: ComponentName;
    imageUrl?: string;
    videoUrl?: string;
    element?: CactusElement;
    promptContentEntryId?: string;
    /**
     * A string token to use to replace values in the text string
     * @type {string}
     */
    textReplacerToken: string = "{{ONBOARDING_SELECTION}}"
    defaultReplacementValue?: string;
    textReplacementType?: TextReplacementType;

    /**
     * True if the default next button actions are enabled,
     * such as keyboard inputs, swipe or the onboarding arrows.
     *
     * When false, it will be up to the component to emit the "next" event in order to continue.
     *
     * @type {boolean}
     */
    defaultNextActionsEnabled: boolean = true;

    buttons: LinkableActionButton[] = [];

    getMarkdownText(options?: { selectedInsight?: string | undefined | null, selectedCoreValue?: CoreValue | null }): string | undefined {
        if (!this.textReplacementType) {
            return this.text;
        }
        switch (this.textReplacementType) {
            case TextReplacementType.selected_insight_word:
                return this.replaceText(options?.selectedInsight);
            case TextReplacementType.onboarding_core_value:
                return this.replaceText(options?.selectedCoreValue)
            default:
                return this.text;
        }
    }

    private replaceText(replacementValue?: string | null | undefined): string | undefined {
        const value = replacementValue ?? this.defaultReplacementValue ?? "";
        return this.text?.replace(this.textReplacerToken, value).replace(/\s\s+/g, ' ');
    }

    static create(params: Partial<OnboardingCardViewModel>): OnboardingCardViewModel {
        const model = new OnboardingCardViewModel();
        Object.assign(model, params);

        return model;
    }

    static createCoreValuesCards(settings: AppSettings | null): OnboardingCardViewModel[] {
        const cards = [
            OnboardingCardViewModel.create({
                type: CardType.text,
                slug: "how-it-works",
                text: "Cactus is a different kind of mindfulness.\n\nIt asks questions to help you focus on what really matters to you.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard1.png?alt=media&token=e36e050c-7564-44c5-8c48-64d64484b3f6"
            }),
            OnboardingCardViewModel.create({
                slug: "discover-core-values",
                type: CardType.mini_core_values,
                defaultNextActionsEnabled: false,
            }),
            OnboardingCardViewModel.create({
                slug: "core-values-intro",
                type: CardType.text,
                text: "Great!\n\n**{{OB_CORE_VALUE}}** is your first core value.\n\nCore values are the expression of what is important to you.\n\nThey shed light on your past and help you make better decisions.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard2.png?alt=media&token=198b352b-c074-4577-8971-1a340054efee",
                defaultReplacementValue: "your core value",
                textReplacementType: TextReplacementType.onboarding_core_value,
                textReplacerToken: "{{OB_CORE_VALUE}}"
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                slug: "cactus-learns",
                text: "As Cactus learns more about you, questions become increasingly about you.\n\nLet's try it now.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard3.png?alt=media&token=3ea75e15-0759-4c5e-8021-09f55c5497b0"
            }),
            OnboardingCardViewModel.create({
                slug: "reflect-on-core-values",
                type: CardType.reflect,
                defaultNextActionsEnabled: false,
                text: "When did **{{OB_CORE_VALUE}}** help you make an important decision?",
                promptContentEntryId: settings?.magicCoreValuesOnboarding.promptEntryId1,
                element: CactusElement.energy,
                defaultReplacementValue: "your core value",
                textReplacementType: TextReplacementType.onboarding_core_value,
                textReplacerToken: "{{OB_CORE_VALUE}}"
            }),
            OnboardingCardViewModel.create({
                slug: "insights",
                type: CardType.insights,
                promptContentEntryId: settings?.magicCoreValuesOnboarding.promptEntryId1,
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                slug: "about-insights",
                text: "Reflect on questions for a few days and you’ll get more insights.",
                componentName: ComponentName.HomeDemoAnimation,
            }),
            OnboardingCardViewModel.create({
                slug: "discover-cactus-plus",
                type: CardType.upsell,
                // text: "Discover your core values when you start a free 7-day trial",
            }),
            OnboardingCardViewModel.create({
                slug: "activity-completed",
                type: CardType.streak,
                text: "Tomorrow you’ll receive a new prompt to continue your journey of self-understanding.\n\nKeep it up and you'll see how you positively change over time.",
                buttons: [{
                    action: ContentAction.complete,
                    label: "Explore Cactus",
                    linkStyle: LinkStyle.buttonPrimary,
                }]
            }),
        ]
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }

    static createMagicMomentCards(settings: AppSettings | null): OnboardingCardViewModel[] {
        const cards = [
            OnboardingCardViewModel.create({
                type: CardType.text,
                slug: "how-it-works",
                text: "Cactus is a different kind of mindfulness.\n\nIt sends you a quick question every day, prompting you to consider what really matters to you, and write it down.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard2.png?alt=media&token=198b352b-c074-4577-8971-1a340054efee"
            }),
            OnboardingCardViewModel.create({
                slug: "about-insights",
                text: "Spend a minute writing and Cactus analyzes your words to reveal surprising insights about your thoughts and emotions.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard3.png?alt=media&token=3ea75e15-0759-4c5e-8021-09f55c5497b0"
            }),
            OnboardingCardViewModel.create({
                slug: "discover-happiness",
                text: "You'll discover the things that contribute to your happiness. You'll make better decisions and experience greater resilience and optimism.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard4.png?alt=media&token=44045a9c-1e23-4ab9-8d4a-ec8e57e75576"
            }),
            OnboardingCardViewModel.create({
                slug: "try-it",
                text: "Let's try it now.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard5.png?alt=media&token=28514978-46ab-4a12-8c4f-89a7d2d20987"
            }),
            OnboardingCardViewModel.create({
                slug: "first-question",
                type: CardType.reflect,
                defaultNextActionsEnabled: false,
                text: "Which physical activities make you feel better?",
                promptContentEntryId: settings?.onboarding.promptEntryId1,
                element: CactusElement.energy,
            }),
            OnboardingCardViewModel.create({
                slug: "build-awareness",
                type: CardType.elements,
                text: "Great! Cactus is built on your awareness and care of five elements:"
            }),
            OnboardingCardViewModel.create({
                slug: "cactus-learns",
                text: "As Cactus learns more about you, questions become increasingly about you.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard6.png?alt=media&token=f103da10-62a7-4a45-92f1-60039bd171d6"
            }),
            OnboardingCardViewModel.create({
                slug: "choose-activity",
                type: CardType.word_cloud,
                text: "Choose the physical activity that **best** improves how you feel:",
            }),
            OnboardingCardViewModel.create({
                slug: "how-does-it-make-you-feel",
                type: CardType.reflect,
                defaultNextActionsEnabled: false,
                text: "How does **{{ONBOARDING_SELECTION}}** make you feel?",
                promptContentEntryId: settings?.onboarding.promptEntryId2,
                element: CactusElement.energy,
                defaultReplacementValue: "this physical activity",
                textReplacementType: TextReplacementType.selected_insight_word,
            }),
            OnboardingCardViewModel.create({
                slug: "insights",
                type: CardType.insights,
                promptContentEntryId: settings?.onboarding.promptEntryId2,
            }),
            OnboardingCardViewModel.create({
                slug: "take-a-moment",
                type: CardType.text,
                text: "Nice work. Take a moment to appreciate the role that **{{ONBOARDING_SELECTION}}** plays in your life.",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "this physical activity",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard2.png?alt=media&token=198b352b-c074-4577-8971-1a340054efee"
            }),
            OnboardingCardViewModel.create({
                slug: "core-values-intro",
                type: CardType.text,
                text: "Besides **{{ONBOARDING_SELECTION}}**, knowing your core values helps you make better, healthier decisions in all aspects of your life.\n\nDo you know your core values?",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "this physical activity",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard1.png?alt=media&token=e36e050c-7564-44c5-8c48-64d64484b3f6"
            }),
            OnboardingCardViewModel.create({
                slug: "discover-core-values",
                type: CardType.upsell,
                // text: "Discover your core values when you start a free 7-day trial",
            }),
            OnboardingCardViewModel.create({
                slug: "activity-completed",
                type: CardType.text,
                text: "You completed your first activity with Cactus! We are excited to be your co-pilot on your journey of self-understanding.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard7.png?alt=media&token=591df28c-fbd1-405c-8a37-31e8d1f6af9b",
                buttons: [{
                    action: ContentAction.complete,
                    label: "Explore Cactus",
                    linkStyle: LinkStyle.buttonPrimary,
                }]
            }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}
