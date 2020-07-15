<template>
    <div class="quote">
        <div class="avatar">
            <img class="avatarImg" :src="testimonial.avatarUrl" :alt="testimonial.name"/>
            <p class="name">{{testimonial.name}}</p>
        </div>
        <p class="quoteText">
            <markdown-text :source="testimonial.quote" treatment="quote"/>
        </p>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { Testimonial } from "@components/landingPages/TestomonialTypes";
    import { Prop } from "vue-property-decorator";
    import MarkdownText from "@components/MarkdownText.vue";

    @Component({
        components: {
            MarkdownText,
        }
    })
    export default class TestimonialCard extends Vue {
        name = "TestimonialCard";

        @Prop({ type: Object as () => Testimonial, required: true })
        testimonial!: Testimonial;
    }
</script>

<style scoped lang="scss">
    @import "variables";
    @import "mixins";

    .quote {
        @include shadowbox;
        align-items: flex-start;
        margin: 0 1.6rem 0 0;
        min-width: 84vw;
        padding: 2.4rem;
        scroll-snap-align: center;
        text-align: left;

        @include r(600) {
            flex-basis: 44%;
            margin-bottom: 3.2rem;
            max-width: 45rem;
            min-width: 32rem;
            padding: 3.2rem;
        }
        @include r(1024) {
            margin: 0 2vw 6.4rem;
        }
    }

    .avatar {
        margin-bottom: 1.6rem;
        text-align: center;
    }

    .avatarImg {
        height: 8rem;
    }

    .name {
        font-size: 1.6rem;
        margin: 0;
        opacity: .5;
    }

    .quoteText {
        margin: 0;
    }
</style>