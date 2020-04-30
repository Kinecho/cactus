import '@styles/common.scss';
import { addDecorator, addParameters } from "@storybook/vue";
import { withA11y } from "@storybook/addon-a11y";

// addParameters({
//     viewport: {
//         viewports: newViewports, // newViewports would be an ViewportMap. (see below for examples)
//         defaultViewport: 'someDefault',
//     },
// });

addDecorator(withA11y);