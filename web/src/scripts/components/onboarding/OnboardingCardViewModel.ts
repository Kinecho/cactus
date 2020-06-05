import { CactusElement } from "@shared/models/CactusElement";

export enum CardType {
    text = "text",
    // photo = "photo",
    reflect = "reflect",
    elements = "elements",
    word_cloud = "word_cloud",
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
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard1.png?alt=media&token=e36e050c-7564-44c5-8c48-64d64484b3f6"
            }),
            OnboardingCardViewModel.create({
                type: CardType.text,
                text: "Cactus is a different kind of mindfulness.\n\nIt sends you a quick question every day, prompting you to consider what really matters to _you_, and write it down.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard2.png?alt=media&token=198b352b-c074-4577-8971-1a340054efee"
            }),
            OnboardingCardViewModel.create({
                text: "Spend a minute writing and Cactus analyzes your words ot reveal surprising insights about your thoughts and emotions.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard3.png?alt=media&token=3ea75e15-0759-4c5e-8021-09f55c5497b0"
            }),
            OnboardingCardViewModel.create({
                text: "You'll discover the things that contribute to your happiness. you'll make better decisions and experience greater resilience and optimism.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard4.png?alt=media&token=44045a9c-1e23-4ab9-8d4a-ec8e57e75576"
            }),
            OnboardingCardViewModel.create({
                text: "Let's try it now.",
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard5.png?alt=media&token=28514978-46ab-4a12-8c4f-89a7d2d20987"
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
                imageUrl: "https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/flamelink%2Fmedia%2Fonboard6.png?alt=media&token=f103da10-62a7-4a45-92f1-60039bd171d6"
            }),
            OnboardingCardViewModel.create({
                type: CardType.word_cloud,
                text: "Choose the physical activity that **best** improves how you feel:",
            }),
        ];
        cards.forEach((card, i) => card.id = `card${ i + 1 }`);
        return cards;
    }
}
