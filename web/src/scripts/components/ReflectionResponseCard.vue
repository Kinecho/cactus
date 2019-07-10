<template>
    <div class="card" v-bind:v-if="response">
        <h3>{{response.promptQuestion}}</h3>
        <p v-if="responseText">
            {{responseText}}
        </p>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import {getAuth, FirebaseUser} from '@web/firebase'
    import ReflectionResponse from '@shared/models/ReflectionResponse'

    declare interface ReflectionResponseCardData {

    }

    export default Vue.extend({
        props: {
            response: ReflectionResponse
        },
        data(): ReflectionResponseCardData {
            return {};
        },
        computed: {
            responseText(): string | undefined {
                return this.response ? this.response.content.text : undefined;
            }
        }
    })

</script>

<style scoped lang="scss">
    @import "~@styles/common.scss";
    @import "~@styles/mixins.scss";

    .card {
        margin-bottom: 1rem;
        padding: 2rem;
        @include shadowbox;
        transition: all .2s ease-in-out;

        &:hover {
            transform: scale(1.05);
        }
    }
</style>