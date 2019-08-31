<template>
    <div v-click-outside="closeMenu" :class="['dropdown-menu-wrapper', {dropdownMenuOpen: menuOpen}]">
        <div v-if="hasCustomButton" @click="toggleMenu()">
            <slot name="custom-button"></slot>
        </div>
        <div class="dropdown-menu">
            <button v-if="!hasCustomButton" @click="toggleMenu()" class="dropdown-menu secondary icon dots wiggle" v-bind:class="{ open: menuOpen }">
                <slot name="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M24 27.059A3.53 3.53 0 1 1 24 20a3.53 3.53 0 0 1 0 7.059zm16.47 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059zm-32.94 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059z"/>
                    </svg>
                </slot>
            </button>
        </div>

        <transition name="fade-down">
            <nav class="moreMenu" v-show="menuOpen">
                <a v-for="(link, index) in links"

                        :href="link.href"
                        v-on:[link.event]="link.onClick"
                        :key="`link_${index}`"
                        :class="{static: link.static, nonBreaking: makeTextNonBreaking}"
                >{{link.title}}</a>
                <!-- <a href="#" v-on:click.prevent="deleteSentPrompt" v-show="prompt">Ignore&nbsp;Question</a> -->
            </nav>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {clickOutsideDirective} from '@web/vueDirectives'
    import {ComputedMenuLink, DropdownMenuLink} from "@components/DropdownMenuTypes"


    export default Vue.extend({
        created() {

        },
        directives: {
            'click-outside': clickOutsideDirective(),
        },
        props: {
            items: {
                type: Array as () => DropdownMenuLink[],
                required: true,
            },
            makeTextNonBreaking: {
                type: Boolean,
                default: true,
            }
        },
        data(): {
            menuOpen: boolean,
        } {
            return {
                menuOpen: false,
            }
        },
        computed: {
            hasCustomButton(): boolean {
                return !!this.$slots['custom-button'];
            },
            links(): ComputedMenuLink[] {
                const clickHandler = (onClick: ((event: Event | any) => void) | undefined) => {
                    if (onClick) {
                        return (event: Event) => {
                            console.log("handling event ");
                            this.menuOpen = false;
                            event.preventDefault();
                            onClick(event);
                        };
                    }
                    return;
                };

                return this.items.map(item => {
                    return {
                        title: item.title,
                        href: item.href || null,
                        onClick: clickHandler(item.onClick),
                        event: item.onClick ? "click" : null,
                        static: item.static,
                    }
                })
            }
        },
        methods: {
            processTitle(input:string):string{
              if (this.makeTextNonBreaking){
                  return input.replace(/\s/g, "&nbsp;")
              }  else {
                  return input;
              }
            },
            toggleMenu() {
                this.menuOpen = !this.menuOpen;
            },
            closeMenu() {
                this.menuOpen = false;
            },
        }
    })
</script>


<style lang="scss">
    @import "common";
    @import "mixins";
    @import "variables";


</style>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .dropdown-menu-wrapper {
        position: relative;
    }

    .dropdown-menu {
        button, a.button {
            align-items: center;
            display: inline-flex;
            flex-grow: 0;
            margin-right: .8rem;

            svg {
                fill: $darkGreen;
                height: 1.6rem;
                margin-right: .8rem;
                width: 1.6rem;
            }

            &.icon {
                padding: .9rem;

                svg {
                    margin-right: 0;
                }
            }

            &.primary svg {
                fill: white;
            }

            &:hover {
                cursor: pointer;
            }
        }


        .secondary {
            margin-right: .8rem;
            transition: all .2s ease;
            outline: transparent none;

            &.open {
                transform: rotate(90deg);
                transform-origin: center;
            }

            &:hover {
                &:hover {
                    cursor: pointer;
                }

                svg {
                    fill: $darkestGreen;
                }
            }
        }

        .wiggle:hover svg {
            animation: wiggle .5s forwards;
        }


    }

    .moreMenu {
        background-color: $lightPink;
        border-radius: 6px;
        right: 0;
        padding: .8rem 0;
        position: absolute;
        top: 4rem;
        z-index: 100;

        a, span {
            background-color: transparent;
            color: $darkestPink;
            display: block;
            font-size: 1.6rem;
            opacity: .8;
            padding: .8rem 2.4rem;
            text-decoration: none;
            transition: opacity .2s ease-in-out, background-color .2s ease-in-out;


            &.static {
                border-bottom: 1px solid darken($pink, 5%);
                color: $darkText;
                margin-bottom: .8rem;
                padding-bottom: 1.6rem;
            }

            &:hover {
                background-color: lighten($lightPink, 2%);
                opacity: 1;
                cursor: pointer;
            }

            &.nonBreaking {
                white-space: nowrap;
                /*line-break: ;*/
            }
        }
    }


</style>
