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
            OnboardingCardViewModel.create({
                text: "Normally, both your asses would be dead as fucking fried chicken, but you happen to pull this shit while I'm in a transitional period so I don't wanna kill you, I wanna help you. But I can't give you this case, it don't belong to me. Besides, I've already been through too much shit this morning over this case to hand it over to your dumb ass.\n" +
                "\n" +
                "The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men. Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness, for he is truly his brother's keeper and the finder of lost children. And I will strike down upon thee with great vengeance and furious anger those who would attempt to poison and destroy My brothers. And you will know My name is the Lord when I lay My vengeance upon thee.\n"
            }),
            OnboardingCardViewModel.create({ text: "Fourth Card is just normal" }),
            OnboardingCardViewModel.create({ text: "Fifth Card is just normal" }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}