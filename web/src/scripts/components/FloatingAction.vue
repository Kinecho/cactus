<template>
    <mounting-portal :mountTo="portalTarget">
        <slot></slot>
    </mounting-portal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component"
    import { MountingPortal } from "portal-vue"

    @Component({
        components: {
            MountingPortal
        }
    })
    export default class FloatingAction extends Vue {
        name = "FloatingAction";

        beforeMount() {
            let fabContainer = document.getElementById("fab")
            if (!fabContainer) {
                fabContainer = document.createElement("div")
                const portal = document.createElement("div");
                portal.classList.add("portal-target");
                fabContainer.appendChild(portal)
                fabContainer.id = "fab";
                document.body.appendChild(fabContainer)
            }
        }

        get portalTarget(): string {
            return "#fab .portal-target"
        }
    }
</script>

<style lang="scss">
    @import "variables";
    #fab {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: $z-fabContainer;
    }
</style>

<style scoped lang="scss">

</style>