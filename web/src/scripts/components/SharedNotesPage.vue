<template>
    <div>
        {{ promptContentEntryId }}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {PageRoute} from '@shared/PageRoutes'
    import Logger from "@shared/Logger";

    const logger = new Logger("PromptContent.vue");

    export default Vue.extend({
        beforeMount(){
            if (!this.promptContentEntryId) {
                this.promptContentEntryId = window.location.pathname.split(`${PageRoute.SHARED_NOTES_ROOT}/`)[1];
                logger.log("using path for promptContentEntryId", this.promptContentEntryId);
            }
        },
        props: {

        },
        data():{
            promptContentEntryId: string | undefined,
        }{
            return {
                promptContentEntryId: undefined,
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

</style>
