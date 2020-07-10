import '@styles/common.scss';
import { addDecorator } from "@storybook/vue";
import { withA11y } from "@storybook/addon-a11y";
import { withKnobs } from "@storybook/addon-knobs";
import Vue from "vue";
//@ts-ignore
import StoryRouter from 'storybook-vue-router';
import Vue2TouchEvents from "vue2-touch-events";

Vue.use(Vue2TouchEvents);

addDecorator(StoryRouter());
addDecorator(withA11y);
addDecorator(withKnobs);

