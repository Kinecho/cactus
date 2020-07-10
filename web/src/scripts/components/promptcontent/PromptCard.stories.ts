import Vue from "vue";
import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
import PromptContentView from "@components/promptcontent/PromptContent.vue";
import PromptContent, { ContentAction, ContentType, LinkStyle, LinkTarget } from "@shared/models/PromptContent";
import CactusMember from "@shared/models/CactusMember";
import ReflectionPrompt from "@shared/models/ReflectionPrompt";
import ReflectionResponse from "@shared/models/ReflectionResponse";

export default {
    title: "Prompts"
}


export const FullStack = () => Vue.extend({
    template: `
        <prompt :cards="cards"
                :responses="responses"
                :index="index"
                @close="onClose"
                @next="next"
                @previous="previous"/>`,
    components: {
        Prompt: PromptContentView,
    },
    data() {
        return {
            index: 0,
        }
    },
    methods: {
        next() {
            this.index = this.index + 1;
        },
        previous() {
            this.index = this.index - 1;
        },
        onClose() {
            alert("The prompt will be closed.");
        },
    },
    computed: {
        member(): CactusMember {
            const memberId = "m123";
            const member = new CactusMember();
            member.id = memberId;
            member.email = "test@cactus.app";
            return member;
        },
        prompt(): ReflectionPrompt {
            const prompt: ReflectionPrompt = new ReflectionPrompt();
            prompt.id = "p123";
            return prompt;
        },
        responses(): ReflectionResponse[] | null {
            return null;
        },
        promptContent(): PromptContent {
            const promptContent = new PromptContent();
            promptContent.entryId = "pc123";
            promptContent.promptId = "p123";
            promptContent.content = [];
            return promptContent;
        },
        cards(): PromptContentCardViewModel[] {
            return PromptContentCardViewModel.createMocks([
                {
                    contentType: ContentType.text,
                    text_md: "Hello **storybook**, nice to see you!",
                    actionButton: {
                        action: ContentAction.showPricing,
                        label: "Show Pricing",
                        linkStyle: LinkStyle.buttonSecondary
                    },
                    link: {
                        linkLabel: "Get some Tamales",
                        destinationHref: "https://texaslonestartamales.com/",
                        linkTarget: LinkTarget.blank,
                        linkStyle: LinkStyle.buttonPrimary,
                        appendMemberId: true,
                    }
                },
                {
                    contentType: ContentType.photo,
                    text_md: "This is the second page",
                    photo: { url: "/assets/images/art.svg" },
                    actionButton: {
                        action: ContentAction.next,
                        label: "Action - Go To Next",
                        linkStyle: LinkStyle.fancyLink
                    }
                },
                {
                    contentType: ContentType.audio,
                    text_md: "This is an audio clip",
                    audio: { url: "http://soundbible.com/grab.php?id=2177&type=mp3" }
                },
                {
                    contentType: ContentType.video,
                    text_md: "This is a youtube video",
                    video: { youtubeVideoId: "dQw4w9WgXcQ" }
                },
                {
                    contentType: ContentType.invite,
                },
                {
                    contentType: ContentType.quote,
                    quote: {
                        text: "Nothing can beat a **nice day**, not even sunshine.",
                        text_md: "Nothing can beat a **nice day**, not even sunshine.",
                        authorTitle: "Author and Singer",
                        authorName: "Neil Poulin",
                        authorAvatar: {
                            url: "/assets/images/plato.svg",
                        }
                    }
                }, {
                    contentType: ContentType.reflect,
                    text_md: "This is the most _important_ question you'll ever see.",
                }, {
                    contentType: ContentType.elements,
                }, {
                    contentType: ContentType.share_reflection,
                }
            ])
        }
    }
})