<template>
    <div class="share-warning">
        <img src="/assets/images/users.svg"/>
        <span class="shareText">This note is shared</span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"

    @Component
    export default class ShareWarning extends Vue {
        name = "ShareWarning";
    }
</script>

<style scoped lang="scss">
    .share-warning {
        align-items: center;
        display: flex;
        margin: -3.2rem 0 4rem;

        .shareText {
            font-size: 1.6rem;
            opacity: .8;
        }

        img {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }
</style>