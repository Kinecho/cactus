import { CactusElement } from "@shared/models/CactusElement";
import { isBlank } from "@shared/util/StringUtil";

export enum CardType {
    text = "text",
    // photo = "photo",
    reflect = "reflect",
    elements = "elements",
    word_cloud = "word_cloud",
    upsell = "upsell",
}

export enum TextReplacementType {
    selected_insight_word = "selected_insight_word"
}

export default class OnboardingCardViewModel {
    id!: string;
    type: CardType = CardType.text;

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

    getMarkdownText(options: { selectedInsight?: string | undefined }): string | undefined {
        if (!this.textReplacementType) {
            return this.text;
        }
        switch (this.textReplacementType) {
            case TextReplacementType.selected_insight_word:
                return this.replaceText(options.selectedInsight);
            default:
                return this.text;
        }
    }

    private replaceText(replacementValue?: string): string | undefined {
        return this.text?.replace(this.textReplacerToken, replacementValue ?? this.defaultReplacementValue ?? "").replace(/\s\s+/g, ' ')
    }

    static create(params: Partial<OnboardingCardViewModel>): OnboardingCardViewModel {
        const model = new OnboardingCardViewModel();
        Object.assign(model, params);

        return model;
    }

    static createAll(): OnboardingCardViewModel[] {
        const cards = [
            OnboardingCardViewModel.create({
                text: "Emptying your mind and focusing on the breath is **harder** than it sounds.\n\nBut it turns out there's more to mindfulness than meditation.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200605.png?alt=media&token=e4e8ecef-7aac-4c4a-a4e9-3646247fc53f"
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                text: "Cactus is a different kind of mindfulness.\n\nIt sends you a quick question every day, prompting you to consider what really matters to _you_, and write it down.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200603.png?alt=media&token=6c4a7f6e-480f-49ba-8f67-63b16060700c"
            }),
            OnboardingCardViewModel.create({
                text: "Spend a minute writing and Cactus analyzes your words ot reveal surprising insights about your thoughts and emotions.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard7.png?alt=media&token=591df28c-fbd1-405c-8a37-31e8d1f6af9b"
            }),
            OnboardingCardViewModel.create({
                text: "You'll discover the things that contribute to your happiness. you'll make better decisions and experience greater resilience and optimism.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard7.png?alt=media&token=591df28c-fbd1-405c-8a37-31e8d1f6af9b"
            }),
            OnboardingCardViewModel.create({
                text: "Let's try it now.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2005273.png?alt=media&token=8fc8e1bc-2757-433b-a5b2-75a35f036d02"
            }),
            OnboardingCardViewModel.create({
                type: CardType.reflect,
                text: "Which physical activities make you feel better?",
                element: CactusElement.energy,
            }),
            OnboardingCardViewModel.create({
                type: CardType.elements,
                text: "Cactus is build on your awareness and care of five elements"
            }),
            OnboardingCardViewModel.create({
                text: "As cactus learns more about you, questions become increasingly about you.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F200519.png?alt=media&token=d4497465-eae3-4e0a-ad6c-b75c586ae143"
            }),
            OnboardingCardViewModel.create({
                type: CardType.word_cloud,
                text: "Choose the physical activity that **best** improves how you feel:",
            }),
            OnboardingCardViewModel.create({
                type: CardType.reflect,
                text: "How does **{{value}}** make you feel?",
                element: CactusElement.energy,
                defaultReplacementValue: "Physical Activity",
                textReplacementType: TextReplacementType.selected_insight_word,
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                text: "Nice work. Take a moment ot appreciate the role that **{{value}}** plays in your life.",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "Physical Activity",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2F2005202.png?alt=media&token=872220d3-f3de-410b-9c8a-07237020b8f8"
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                text: "Besides **{{value}}**, knowing your core values helps you make better, healthier decisions in all aspects of your life.\n\nDo you know your core values?",
                textReplacementType: TextReplacementType.selected_insight_word,
                defaultReplacementValue: "Physical Activity",
            }),
            OnboardingCardViewModel.create({
                type: CardType.upsell,
                text: "Discover your core values when you start a free 7-day trial. We'll send you questions tailored uniquely to your core values.\n\nThe trial includes other features, too.",
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                text: "Upgrade success",
            }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}