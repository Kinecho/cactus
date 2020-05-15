import '@styles/common.scss';
import { addDecorator } from "@storybook/vue";
import { withA11y } from "@storybook/addon-a11y";
import { withKnobs } from "@storybook/addon-knobs";

//@ts-ignore
import StoryRouter from 'storybook-vue-router';

addDecorator(StoryRouter());
addDecorator(withA11y);
addDecorator(withKnobs);
