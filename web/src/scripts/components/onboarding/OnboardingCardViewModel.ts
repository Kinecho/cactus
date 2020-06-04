import { CactusElement } from "@shared/models/CactusElement";

export enum CardType {
    text = "text",
    photo = "photo",
    reflect = "reflect",
}


export class OnboardingCardViewModel {
    id!: string;
    type: CardType = CardType.text;

    /**
     * Markdown enabled text
     */
    text?: string;
    imageUrl?: string;
    element?: CactusElement;

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
            })
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}