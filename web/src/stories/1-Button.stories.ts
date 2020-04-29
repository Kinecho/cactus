import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import WordChart from "@components/InsightWordChart.vue";
import MyButton from './MyButton';
import { InsightWord } from "@shared/models/ReflectionResponse";

export default {
    title: 'Button',
    component: MyButton,
};

export const Text = () => ({
    components: { MyButton },
    template: '<my-button @click="action">Hello Button</my-button>',
    methods: { action: action('clicked') },
});

// export const Jsx = () => ({
//   components: { MyButton },
//   render(h:any) {
//     return <MyButton onClick={this.action}>With JSX</MyButton>;
//   },
//   methods: { action: linkTo('clicked') },
// });

export const Emoji = () => ({
    components: { MyButton },
    template: '<my-button @click="action">😀 😎 👍 💯</my-button>',
    methods: { action: linkTo('clicked') },
});
