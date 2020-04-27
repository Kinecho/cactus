// @ts-ignore
import CoreValuesPage from "@components/CoreValuesPage.vue"
import Vue from "vue";
import { commonInit } from "@web/common";
import Logger from "@shared/Logger";
import { getQueryParam } from "@web/util";
import { isBlank } from "@shared/util/StringUtil";
import { QueryParam } from "@shared/util/queryParams";

const logger = new Logger("CoreValuesPage");
commonInit();


new Vue({
    el: "#app",
    template: `
        <CoreValuesPage/>`,
    components: {
        CoreValuesPage,
    },
    data(): {embed: boolean} {
        const embed = !isBlank(getQueryParam(QueryParam.EMBED));
        return { embed }
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}