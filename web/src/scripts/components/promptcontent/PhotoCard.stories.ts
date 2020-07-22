import Vue from "vue";
import PhotoCard from "@components/promptcontent/PhotoCard.vue";
import PromptContentCardViewModel from "@components/promptcontent/PromptContentCardViewModel";
import { Content, ContentType } from "@shared/models/PromptContent";

export default {
    title: "Prompts/Photo Card"
}

export const WithPhoto = () => Vue.extend({
    template: `
        <photo-card :card="cards[0]" :index="0"/>`,
    components: {
        PhotoCard,
    }, computed: {
        cards(): PromptContentCardViewModel[] {
            const content: Content = {
                contentType: ContentType.photo,
                text_md: "Photo **Card** Text",
                photo: {
                    url: "/assets/images/cactusPots.svg",
                }
            }
            const cards = PromptContentCardViewModel.createMocks([content]);

            return cards;
        }
    }
})