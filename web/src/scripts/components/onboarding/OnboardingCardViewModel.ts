export enum CardType {
    text = "text",
}

export class OnboardingCardViewModel {
    id!: string;
    type: CardType = CardType.text;

    /**
     * Markdown enabled text
     */
    text?: string;

    static create(params: Partial<OnboardingCardViewModel>): OnboardingCardViewModel {
        const model = new OnboardingCardViewModel();
        Object.assign(model, params);

        return model;
    }

    static createAll(): OnboardingCardViewModel[] {
        const cards = [
            OnboardingCardViewModel.create({ text: "First Card with _italics text_" }),
            OnboardingCardViewModel.create({ text: "Second Card with **super bold stuff**" }),
            OnboardingCardViewModel.create({ text: "Third Card is just normal" }),
            OnboardingCardViewModel.create({ text: "Fourth Card is just normal" }),
            OnboardingCardViewModel.create({ text: "Fifth Card is just normal" }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}