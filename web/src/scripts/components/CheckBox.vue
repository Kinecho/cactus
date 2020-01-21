<template>
    <label :class="['checkbox-container', {disabled}]">
        <input type="checkbox" :checked="shouldBeChecked" :value="value" @change="updateInput" :disabled="disabled">
        <span class="checkmark"></span>
        <span class="checkbox-label">{{ label }}</span>
    </label>
</template>
<script lang="ts">
    import Vue from 'vue'

    export default Vue.extend({
        model: {
            prop: 'modelValue',
            event: 'change',
        },
        props: {
            value: {
                type: [String, Boolean],
            },
            disabled: {
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
            }
            ,
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
        }
    }

    /* Hide the browser's default checkbox */
    input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;

        &:disabled ~ .checkmark {
            background-color: $lightText;
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
    }

    /* Create a custom checkbox */
    .checkmark {
        background-color: $white;
        border: 1px solid $green;
        border-radius: .4rem;
        flex-shrink: 0;
        height: $checkHeight;
        margin-right: .8rem;
        width: $checkHeight;

        /* Create the checkmark/indicator (hidden when not checked) */
        &:after {
            border: solid white;
            border-width: 0 3px 3px 0;
            content: "";
            display: none;
            height: 10px;
            left: 9px;
            position: absolute;
            top: 5px;
            transform: rotate(45deg);
            width: 5px;
        }
    }

</style>
