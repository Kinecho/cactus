import {Project} from "@scripts/config";

export const chooseEnvironment = {
    message: "Choose an environment",
    name: "environment",
    type: "select",
    choices: [{title: "Prod", value: Project.PROD}, {title: "Stage", value: Project.STAGE}]
};