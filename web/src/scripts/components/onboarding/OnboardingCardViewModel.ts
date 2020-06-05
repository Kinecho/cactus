import { CactusElement } from "@shared/models/CactusElement";

export enum CardType {
    text = "text",
    // photo = "photo",
    reflect = "reflect",
    elements = "elements",
    word_cloud = "word_cloud",
    upsell = "upsell",
    celebrate = "celebrate",
}

export enum TextReplacementType {
    selected_insight_word = "selected_insight_word"
}

export default class OnboardingCardViewModel {
    id!: string;
    type: CardType = CardType.text;
    slug?: string;
    /**
     * Markdown enabled text
     */
    text?: string;
    imageUrl?: string;
    element?: CactusElement;

    /**
     * A string token to use to replace values in the text string
     * @type {string}
     */
    textReplacerToken: string = "{{value}}"
    defaultReplacementValue?: string;
    textReplacementType?: TextReplacementType;

    getMarkdownText(options?: { selectedInsight?: string | undefined | null }): string | undefined {
        if (!this.textReplacementType) {
            return this.text;
        }
        switch (this.textReplacementType) {
            case TextReplacementType.selected_insight_word:
                return this.replaceText(options?.selectedInsight);
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

    static createAll(): OnboardingCardViewModel[] {
        const cards = [
            OnboardingCardViewModel.create({
                slug: "welcome",
                text: "Emptying your mind and focusing on the breath is **harder** than it sounds.\n\nBut it turns out there's more to mindfulness than meditation.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard1.png?alt=media&token=e36e050c-7564-44c5-8c48-64d64484b3f6"
            }),
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
                text: "Which physical activities make you feel better?",
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
                text: "How does **{{value}}** make you feel?",
                element: CactusElement.energy,
                defaultReplacementValue: "Physical Activity",
                textReplacementType: TextReplacementType.selected_insight_word,
            }),
            OnboardingCardViewModel.create({
                slug: "take-a-moment",
                type: CardType.text,
                text: "Nice work. Take a moment to appreciate the role that **{{value}}** plays in your life.",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "Physical Activity",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard2.png?alt=media&token=198b352b-c074-4577-8971-1a340054efee"
            }),
            OnboardingCardViewModel.create({
                slug: "core-values-intro",
                type: CardType.text,
                text: "Besides **{{value}}**, knowing your core values helps you make better, healthier decisions in all aspects of your life.\n\nDo you know your core values?",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "Physical Activity",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard1.png?alt=media&token=e36e050c-7564-44c5-8c48-64d64484b3f6"
            }),
            OnboardingCardViewModel.create({
                slug: "discover-core-values",
                type: CardType.upsell,
                text: "Discover your core values when you start a free 7-day trial",
            }),
            OnboardingCardViewModel.create({
                slug: "activity-completed",
                type: CardType.text,
                text: "You completed your first activity with Cactus! We are excited to be your co-pilot on your journey of self-understanding.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard7.png?alt=media&token=591df28c-fbd1-405c-8a37-31e8d1f6af9b"
            }),
            OnboardingCardViewModel.create({
                slug: "summary",
                type: CardType.celebrate,
            }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}
