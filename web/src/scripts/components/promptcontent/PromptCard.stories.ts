import Vue from "vue";
import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
import PromptContentView from "@components/promptcontent/PromptContent.vue";
import PromptContent, { ContentType } from "@shared/models/PromptContent";
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
                { contentType: ContentType.text, text_md: "Hello **storybook**, nice to see you!" },
                {
                    contentType: ContentType.photo,
                    text_md: "This is the second page",
                    photo: { url: "/assets/images/art.svg" }
                }, {
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

                }
            ])
        }
    }
})