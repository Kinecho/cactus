import Vue from "vue";
import MilestoneProgress from "@components/insights/MilestoneProgress.vue"
import { number } from "@storybook/addon-knobs";
import { getMilestoneText } from "@components/insights/MilestoneTypes";
import MarkdownText from "@components/MarkdownText.vue";

export default {
    title: "Insights/Milestone Progress"
}

export const DayOne = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 1)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DayTwo = () => Vue.extend({
    template: `<div>
    <h2><markdown-text :source="message.title"/></h2>
    <p><markdown-text :source="message.message"/></p>
    <MilestoneProgress :total-reflections="totalReflections"/>
    <br/>
    <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 2)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DayThree = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 3)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DayFour = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 4)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DayFive = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 5)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DaySix = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 6)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})

export const DaySeven = () => Vue.extend({
    template: `<div>
        <h2><markdown-text :source="message.title"/></h2>
        <p><markdown-text :source="message.message"/></p>
        <MilestoneProgress :total-reflections="totalReflections"/>
         <br/>
        <pre>Note: message and title are added for testing purposes and are not styled</pre>
    </div>`,
    components: {
        MilestoneProgress,
        MarkdownText
    },
    props: {
        totalReflections: {
            default: number("Total Reflections", 7)
        }
    },
    computed: {
        message(): {title: string, message: string} {
            return getMilestoneText(this.totalReflections)
        }
    }
})