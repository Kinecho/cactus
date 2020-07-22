import Spinner from "@components/Spinner.vue";
import Vue from "vue";

export default {
    title: "Spinner"
}

export const Default = () => Vue.extend({
    template: `
        <div>
            <spinner/>
        </div>
    `,
    components: {
        Spinner,
    }
})