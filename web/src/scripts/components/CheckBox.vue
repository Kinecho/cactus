<template>
    <label :class="['checkbox-container', this.classNames]">
        <input type="checkbox" :checked="shouldBeChecked" :value="value" @change="updateInput" :disabled="disabled" :tabindex="tabindex">
        <!--        <img class="icon" v-if="icon" :src="`/assets/images/${icon}.svg`" />-->
        <SvgIcon :icon="icon" v-if="icon"/>
        <span class="checkmark" :class="selectTypeClass"></span>
        <span class="checkbox-label">{{ label }}</span>
    </label>
</template>
<script lang="ts">
    import Vue from 'vue'
    import { QuestionType } from "@shared/models/Questions";
    import { SvgIconName } from "@shared/types/IconTypes";
    import SvgIcon from "@components/SvgIcon.vue";

    export default Vue.extend({
        components: { SvgIcon },
        model: {
            prop: 'modelValue',
            event: 'change',
        },
        props: {
            tabindex: {
                type: Number,
                default: -1
            },
            value: {
                type: [String, Boolean],
            },
            type: {
                type: String as () => QuestionType,
                default: QuestionType.MULTI_SELECT,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
            extraPadding: {
                type: Boolean,
                default: false,
            },
            vertCenter: {
                type: Boolean,
                default: false,
            },
            modelValue: {
                default: false,
                type: [Boolean, String, Array],
            },
            label: {
                type: String,
                required: true,
            },
            icon: {
                type: String as () => SvgIconName,
                required: false,
            },
            // We set `true-value` and `false-value` to the default true and false so
            // we can always use them instead of checking whether or not they are set.
            // Also can use camelCase here, but hyphen-separating the attribute name
            // when using the component will still work
            trueValue: {
                type: [Boolean, String],
                default: true,
            },
            falseValue: {
                type: [Boolean, String],
                default: false,
            },
        },
        data() {
            return {}
        },
        computed: {
            classNames(): { [name: string]: boolean } {
                return {
                    disabled: this.disabled,
                    extraPadding: this.extraPadding,
                    vertCenter: this.vertCenter,
                    radio: this.type === QuestionType.RADIO,
                    checkbox: this.type === QuestionType.MULTI_SELECT
                }
            },
            selectTypeClass(): string {
                switch (this.type) {
                    case QuestionType.RADIO:
                        return "radio";
                    case QuestionType.MULTI_SELECT:
                        return "checkmark";
                }
            },
            shouldBeChecked() {
                if (Array.isArray(this.modelValue)) {
                    return this.modelValue.includes(this.value)
                }
                // Note that `true-value` and `false-value` are camelCase in the JS
                return this.modelValue === this.trueValue
            },
        },
        methods: {
            updateInput(event: Event): void {
                let isChecked = false;
                let checkbox = event.target as HTMLInputElement;
                if (checkbox) {
                    isChecked = checkbox.checked;
                }

                if (Array.isArray(this.modelValue)) {
                    let newValue = [...this.modelValue];

                    if (isChecked) {
                        newValue.push(this.value)
                    } else {
                        newValue.splice(newValue.indexOf(this.value), 1)
                    }

                    this.$emit('change', newValue)
                } else {
                    this.$emit('change', isChecked ? this.trueValue : this.falseValue)
                }
            },
        },
    })
</script>

<style scoped lang="scss">
    @import "variables";

    $checkHeight: 2.5rem;

    .checkbox-container {
        cursor: pointer;
        display: flex;
        position: relative;
        user-select: none;

        &:hover input:not(:checked) ~ .checkmark {
            border-color: $darkGreen;
        }

        &.disabled {
            color: $lightText;
            cursor: default;

            &:hover input:not(:checked) ~ .checkmark {
                border-color: #ccc;
            }
        }

        &.extraPadding {
            padding: 1.6rem;
        }

        &.vertCenter {
            align-items: center;
        }
    }

    /* Hide the browser's default checkbox */
    input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;

        &:focus {
            background-color: red;
        }

        &:disabled ~ .checkmark {
            border-color: #ccc;
            cursor: default;
        }

        &:disabled:checked ~ .checkmark {
            background-color: $lightText;

            &:after {
                display: block;
            }
        }

        &:checked ~ .checkmark {
            background-color: $green;

            &:after {
                display: block;
            }
        }

        &:checked ~ .checkmark.radio {
            align-items: center;
            display: flex;
            justify-content: center;

            &:after {
                background-color: $green;
                border: .5rem solid $white;
                border-radius: 50%;
                content: '';
                height: 1.3rem;
                width: 1.3rem;
            }
        }
    }

    /* Create a custom checkbox */
    .checkmark {
        border: 1px solid $green;
        border-radius: .4rem;
        flex-shrink: 0;
        height: $checkHeight;
        margin-right: 1.6rem;
        width: $checkHeight;

        /* Create the checkmark/indicator (hidden when not checked) */
        &:not(.radio):after {
            border: solid white;
            border-width: 0 3px 3px 0;
            content: "";
            display: none;
            height: 10px;
            left: .9rem;
            position: absolute;
            top: .5rem;
            transform: rotate(45deg);
            width: 5px;

            .extraPadding & {
                left: 2.5rem;
                top: 2.1rem;
            }
        }

        &.radio {
            border-radius: 50%;
        }
    }

    .icon {
        height: 3.2rem;
        margin-right: 1.6rem;
        width: 3.2rem;
    }

    input:checked ~ .icon + .checkmark.radio,
    .icon + .checkmark {
        display: none;
    }

    .checkbox-label {
        font-size: 1.8rem;
    }

</style>
