<template>
    <div>
        <h3 class="question">{{questionText}}</h3>
        <p v-show="!prompt && promptLoaded" class="warning prompt">
            Oops! We were unable to load the question for this day.
        </p>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ReflectionPrompt from '@shared/models/ReflectionPrompt'

    export default Vue.extend({
        created() {

        },
        props: {
            prompt: {
                type: Object as () => ReflectionPrompt
            }
        },
        data(): {} {
            return {}
        },
        computed: {
            questionText(): string | undefined {
                return this.prompt.question
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
