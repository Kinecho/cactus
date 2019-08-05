<template>
    <label class="checkbox-container">
        <input type="checkbox" :checked="shouldBeChecked" :value="value" @change="updateInput">
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
                type: String,
            },
            modelValue: {
                default: false,
                // type: Boolean,
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
            trueValue:
                {
                    default:
                        true,
                }
            ,
            falseValue: {
                default:
                    false,
            },
        },
        computed: {
            shouldBeChecked() {
                if (Array.isArray(this.modelValue)) {
                    return this.modelValue.includes(this.value)
                }
                // Note that `true-value` and `false-value` are camelCase in the JS
                return this.modelValue === this.trueValue
            },
        }
        ,
        methods: {
            updateInput(event: any) {
                let isChecked = event.target.checked;

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
        display: flex;
        align-items: center;
        position: relative;
        cursor: pointer;
        margin-bottom: 1rem;

        .checkbox-label {
            font-weight: normal;
            color: $darkText;
            /*font-size: 1.2rem;*/
        }

        &:hover input:not(:checked) ~ .checkmark{
            background-color: #ccc;
        }

        /* Hide the browser's default checkbox */
        input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;

            &:checked ~ .checkmark {
                background-color: #2196F3;
                &:after {
                    display: block;
                }
            }
        }

        /* Create a custom checkbox */
        .checkmark {
            height: $checkHeight;
            width: $checkHeight;
            background-color: #eee;
            margin-right: .8rem;
            /* Create the checkmark/indicator (hidden when not checked) */
            &:after {
                content: "";
                position: absolute;
                display: none;

                left: 9px;
                top: 5px;
                width: 5px;
                height: 10px;
                border: solid white;
                border-width: 0 3px 3px 0;
                -webkit-transform: rotate(45deg);
                -ms-transform: rotate(45deg);
                transform: rotate(45deg);
            }
        }
    }
</style>