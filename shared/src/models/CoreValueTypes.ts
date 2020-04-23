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
        [CoreValue.ConnectingToOthers]: new CoreValueMeta(CoreValue.ConnectingToOthers, "The sense of being open and available to another person, even as you feel they are open and available to you"),
        [CoreValue.HolisticLiving]: new CoreValueMeta(CoreValue.HolisticLiving, "You make intentional choices to care for your mind, body, and soul"),
        [CoreValue.MentalHealth]: new CoreValueMeta(CoreValue.MentalHealth, "The general condition of your mental and emotional state"),
        [CoreValue.PersonalGrowth]: new CoreValueMeta(CoreValue.PersonalGrowth, "Improvements in your physical, emotional, intellectual, spiritual, social, and/or financial state."),
        [CoreValue.SelfCare]: new CoreValueMeta(CoreValue.SelfCare, "You take action to preserve or improve your own health."),
        [CoreValue.SelfExpression]: new CoreValueMeta(CoreValue.SelfExpression, "The expression of one's individuality (usually through creative activities)"),
        [CoreValue.SelfRealization]: new CoreValueMeta(CoreValue.SelfRealization, "The true fulfillment of your potential capacities"),
        [CoreValue.SelfReliance]: new CoreValueMeta(CoreValue.SelfReliance, "Personal independence"),
        Abundance: new CoreValueMeta(CoreValue.Abundance, "You value having an adequate quantity of everything you need in your life. "),
        Accomplishment: new CoreValueMeta(CoreValue.Accomplishment, "The action of accomplishing something"),
        Accountability: new CoreValueMeta(CoreValue.Accountability, "Responsibility to someone or for some activity"),
        Achievement: new CoreValueMeta(CoreValue.Achievement, "The action of achieving your goals"),
        Adventure: new CoreValueMeta(CoreValue.Adventure, "A willingness to commit to an uncertain outcome with an open heart and to learn and engage. It is the ability to take a leap into the unknown with mindfulness and grace."),
        Altruism: new CoreValueMeta(CoreValue.Altruism, "The quality of unselfish concern for the welfare of others"),
        Appearance: new CoreValueMeta(CoreValue.Appearance, "Outward or visible aspect of a person or thing"),
        Autonomy: new CoreValueMeta(CoreValue.Autonomy, "Independence and freedom in decision making."),
        Beauty: new CoreValueMeta(CoreValue.Beauty, "The qualities that give pleasure to the senses"),
        Calm: new CoreValueMeta(CoreValue.Calm, "A state of tranquility"),
        Clarity: new CoreValueMeta(CoreValue.Clarity, "The comprehensibility of clear expression"),
        Commitment: new CoreValueMeta(CoreValue.Commitment, "The act of binding yourself (intellectually or emotionally) to a course of action"),
        Communication: new CoreValueMeta(CoreValue.Communication, "You value the act of conveying information between two people"),
        Community: new CoreValueMeta(CoreValue.Community, "A group of people having a common culture"),
        Creativity: new CoreValueMeta(CoreValue.Creativity, "The ability to conceive of new ideas and solutions to problems"),
        Empathy: new CoreValueMeta(CoreValue.Empathy, "Understanding and entering into another's feelings"),
        Energy: new CoreValueMeta(CoreValue.Energy, "An imaginative lively style (especially style of writing); enterprising or ambitious drive; forceful exertion"),
        Family: new CoreValueMeta(CoreValue.Family, "Your primary social group of friends or relatives"),
        Flexibility: new CoreValueMeta(CoreValue.Flexibility, "Ability to adapt to situational demands, balance life demands, and commit to behaviors. "),
        Freedom: new CoreValueMeta(CoreValue.Freedom, "The right to act, speak, or think however you want without restraint."),
        Friendship: new CoreValueMeta(CoreValue.Friendship, "A close association between you and someone else marked by feelings of care, respect, admiration, concern, or even love"),
        Fulfillment: new CoreValueMeta(CoreValue.Fulfillment, "A feeling of satisfaction at having achieved your desires"),
        Fun: new CoreValueMeta(CoreValue.Fun, "Living a life full of activities that are enjoyable or amusing"),
        Grace: new CoreValueMeta(CoreValue.Grace, "A disposition to kindness and compassion"),
        Growth: new CoreValueMeta(CoreValue.Growth, "Your progression from simpler to more complex forms, often emotion or skills based"),
        Honesty: new CoreValueMeta(CoreValue.Honesty, "You value being honest to all those in your life"),
        Humor: new CoreValueMeta(CoreValue.Humor, "The trait of appreciating (and being able to express) the humorous"),
        Integrity: new CoreValueMeta(CoreValue.Integrity, "Moral soundness"),
        Intimacy: new CoreValueMeta(CoreValue.Intimacy, "Close or warm friendship"),
        Joy: new CoreValueMeta(CoreValue.Joy, "Something or someone that provides pleasure; a source of happiness"),
        Leadership: new CoreValueMeta(CoreValue.Leadership, "The activity of leading; the ability to lead; the body of people who lead a group; the status of a leader"),
        Loyalty: new CoreValueMeta(CoreValue.Loyalty, "Feelings of allegiance; the act of binding yourself (intellectually or emotionally) to a course of action"),
        Nature: new CoreValueMeta(CoreValue.Nature, "The natural physical world including plants and animals and landscapes "),
        Openness: new CoreValueMeta(CoreValue.Openness, "An attitude of ready accessibility (especially about one's actions or purposes)"),
        Orderliness: new CoreValueMeta(CoreValue.Orderliness, "The quality of appreciating method and system"),
        Originality: new CoreValueMeta(CoreValue.Originality, "The ability to think and act independently"),
        Partnership: new CoreValueMeta(CoreValue.Partnership, "A cooperative relationship between people or groups who agree to share responsibility for achieving some specific goal"),
        Personal: new CoreValueMeta(CoreValue.Personal, "Concerning or affecting a particular person or his or her private life and personality"),
        Power: new CoreValueMeta(CoreValue.Power, "Possession of controlling influence"),
        Privacy: new CoreValueMeta(CoreValue.Privacy, "You value concealing or hiding yourself in literal and abstract ways."),
        Professionalism: new CoreValueMeta(CoreValue.Professionalism, "The competence or skill expected of a professional"),
        Recognition: new CoreValueMeta(CoreValue.Recognition, "The state or quality of being recognized or acknowledged"),
        Respect: new CoreValueMeta(CoreValue.Respect, "An attitude of admiration or esteem"),
        Romance: new CoreValueMeta(CoreValue.Romance, "An emotional attraction or aura belonging to an especially heroic era, adventure, or activity"),
        Security: new CoreValueMeta(CoreValue.Security, "A guarantee that an obligation will be met; freedom from anxiety or fear"),
        Service: new CoreValueMeta(CoreValue.Service, "The action of helping or doing work for someone."),
        Stewardship: new CoreValueMeta(CoreValue.Stewardship, "Being instrumental in the moving along of things"),
        Structure: new CoreValueMeta(CoreValue.Structure, "A definite pattern of organization"),
        Success: new CoreValueMeta(CoreValue.Success, "Reaching milestones that represent success for you"),
        Trust: new CoreValueMeta(CoreValue.Trust, "The trait of believing in the honesty and reliability of others"),
        Truth: new CoreValueMeta(CoreValue.Truth, "The quality of being near to the true value"),
        Vision: new CoreValueMeta(CoreValue.Vision, "The formation of a mental image of something that is not perceived as real and is not present to the senses"),
        Vitality: new CoreValueMeta(CoreValue.Vitality, "The property of being able to survive and grow"),
    }
}
