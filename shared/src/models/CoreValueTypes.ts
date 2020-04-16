export enum CoreValue {
    Adventure = "Adventure",
    Autonomy = "Autonomy",
    Flexibility = "Flexibility",
    Freedom = "Freedom",
    PersonalGrowth = "Personal Growth",
    SelfExpression = "Self-Expression",
    SelfReliance = "Self-Reliance",
    Stewardship = "Stewardship",
    Trust = "Trust",
    Vision = "Vision",
    Clarity = "Clarity",
    SelfCare = "Self-Care",
    Appearance = "Appearance",
    Personal = "Personal",
    Humor = "Humor",
    Commitment = "Commitment",
    Altruism = "Altruism",
    Nature = "Nature",
    Security = "Security",
    Power = "Power",
    Fulfillment = "Fulfillment",
    Accomplishment = "Accomplishment",
    Achievement = "Achievement",
    Growth = "Growth",
    Leadership = "Leadership",
    Professionalism = "Professionalism",
    Recognition = "Recognition",
    SelfRealization = "Self-Realization",
    Success = "Success",
    Truth = "Truth",
    Vitality = "Vitality",
    Grace = "Grace",
    Fun = "Fun",
    Orderliness = "Orderliness",
    Honesty = "Honesty",
    Abundance = "Abundance",
    Energy = "Energy",
    Creativity = "Creativity",
    Privacy = "Privacy",
    Openness = "Openness",
    Communication = "Communication",
    Community = "Community",
    ConnectingToOthers = "Connecting to Others",
    Empathy = "Empathy",
    Family = "Family",
    Friendship = "Friendship",
    Intimacy = "Intimacy",
    Loyalty = "Loyalty",
    Partnership = "Partnership",
    Service = "Service",
    Romance = "Romance",
    Calm = "Calm",
    Originality = "Originality",
    MentalHealth = "Mental Health",
    Beauty = "Beauty",
    Structure = "Structure",
    Accountability = "Accountability",
    HolisticLiving = "Holistic Living",
    Integrity = "Integrity",
    Joy = "Joy",
    Respect = "Respect",
}

export class CoreValueMeta {
    value: CoreValue;
    title: string;
    description: string;

    constructor(coreValue: CoreValue, description: string, title?: string) {
        this.value = coreValue;
        this.description = description;
        this.title = title ?? coreValue;

        this.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. "
    }
}


export type CoreValuesMap = { [value in CoreValue]: CoreValueMeta };


export class CoreValuesService {
    static shared = new CoreValuesService();
    metaByValue: CoreValuesMap = createCoreValuesMetaMap();

    getMeta(value: CoreValue): CoreValueMeta {
        return this.metaByValue[value];
    }
}

function createCoreValuesMetaMap(): CoreValuesMap {
    return {
        [CoreValue.ConnectingToOthers]: new CoreValueMeta(CoreValue.ConnectingToOthers, ""),
        [CoreValue.HolisticLiving]: new CoreValueMeta(CoreValue.HolisticLiving, ""),
        [CoreValue.MentalHealth]: new CoreValueMeta(CoreValue.MentalHealth, ""),
        [CoreValue.PersonalGrowth]: new CoreValueMeta(CoreValue.PersonalGrowth, ""),
        [CoreValue.SelfCare]: new CoreValueMeta(CoreValue.SelfCare, ""),
        [CoreValue.SelfExpression]: new CoreValueMeta(CoreValue.SelfExpression, ""),
        [CoreValue.SelfRealization]: new CoreValueMeta(CoreValue.SelfRealization, ""),
        [CoreValue.SelfReliance]: new CoreValueMeta(CoreValue.SelfReliance, ""),
        Abundance: new CoreValueMeta(CoreValue.Abundance, ""),
        Accomplishment: new CoreValueMeta(CoreValue.Accomplishment, ""),
        Accountability: new CoreValueMeta(CoreValue.Accountability, ""),
        Achievement: new CoreValueMeta(CoreValue.Achievement, ""),
        Adventure: new CoreValueMeta(CoreValue.Adventure, ""),
        Altruism: new CoreValueMeta(CoreValue.Altruism, ""),
        Appearance: new CoreValueMeta(CoreValue.Appearance, ""),
        Autonomy: new CoreValueMeta(CoreValue.Autonomy, ""),
        Beauty: new CoreValueMeta(CoreValue.Beauty, ""),
        Calm: new CoreValueMeta(CoreValue.Calm, ""),
        Clarity: new CoreValueMeta(CoreValue.Clarity, ""),
        Commitment: new CoreValueMeta(CoreValue.Commitment, ""),
        Communication: new CoreValueMeta(CoreValue.Communication, ""),
        Community: new CoreValueMeta(CoreValue.Community, ""),
        Creativity: new CoreValueMeta(CoreValue.Creativity, ""),
        Empathy: new CoreValueMeta(CoreValue.Empathy, ""),
        Energy: new CoreValueMeta(CoreValue.Energy, ""),
        Family: new CoreValueMeta(CoreValue.Family, ""),
        Flexibility: new CoreValueMeta(CoreValue.Flexibility, ""),
        Freedom: new CoreValueMeta(CoreValue.Freedom, ""),
        Friendship: new CoreValueMeta(CoreValue.Friendship, ""),
        Fulfillment: new CoreValueMeta(CoreValue.Fulfillment, ""),
        Fun: new CoreValueMeta(CoreValue.Fun, ""),
        Grace: new CoreValueMeta(CoreValue.Grace, ""),
        Growth: new CoreValueMeta(CoreValue.Growth, ""),
        Honesty: new CoreValueMeta(CoreValue.Honesty, ""),
        Humor: new CoreValueMeta(CoreValue.Humor, ""),
        Integrity: new CoreValueMeta(CoreValue.Integrity, ""),
        Intimacy: new CoreValueMeta(CoreValue.Intimacy, ""),
        Joy: new CoreValueMeta(CoreValue.Joy, ""),
        Leadership: new CoreValueMeta(CoreValue.Leadership, ""),
        Loyalty: new CoreValueMeta(CoreValue.Loyalty, ""),
        Nature: new CoreValueMeta(CoreValue.Nature, ""),
        Openness: new CoreValueMeta(CoreValue.Openness, ""),
        Orderliness: new CoreValueMeta(CoreValue.Orderliness, ""),
        Originality: new CoreValueMeta(CoreValue.Originality, ""),
        Partnership: new CoreValueMeta(CoreValue.Partnership, ""),
        Personal: new CoreValueMeta(CoreValue.Personal, ""),
        Power: new CoreValueMeta(CoreValue.Power, ""),
        Privacy: new CoreValueMeta(CoreValue.Privacy, ""),
        Professionalism: new CoreValueMeta(CoreValue.Professionalism, ""),
        Recognition: new CoreValueMeta(CoreValue.Recognition, ""),
        Respect: new CoreValueMeta(CoreValue.Respect, ""),
        Romance: new CoreValueMeta(CoreValue.Romance, ""),
        Security: new CoreValueMeta(CoreValue.Security, ""),
        Service: new CoreValueMeta(CoreValue.Service, ""),
        Stewardship: new CoreValueMeta(CoreValue.Stewardship, ""),
        Structure: new CoreValueMeta(CoreValue.Structure, ""),
        Success: new CoreValueMeta(CoreValue.Success, ""),
        Trust: new CoreValueMeta(CoreValue.Trust, ""),
        Truth: new CoreValueMeta(CoreValue.Truth, ""),
        Vision: new CoreValueMeta(CoreValue.Vision, ""),
        Vitality: new CoreValueMeta(CoreValue.Vitality, ""),
    }
}