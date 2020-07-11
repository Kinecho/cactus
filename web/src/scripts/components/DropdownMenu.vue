<template>
    <div v-click-outside="closeMenu" :class="['dropdown-menu-wrapper', {dropdownMenuOpen: menuOpen}]">
        <div v-if="hasCustomButton" @click="toggleMenu()">
            <slot name="custom-button"></slot>
        </div>
        <div class="dropdown-menu">
            <button aria-label="Options" v-if="!hasCustomButton" @click="toggleMenu()" class="dropdown-menu secondary icon dots wiggle" v-bind:class="{ open: menuOpen }">
                <slot name="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                        <path d="M24 27.059A3.53 3.53 0 1 1 24 20a3.53 3.53 0 0 1 0 7.059zm16.47 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059zm-32.94 0a3.53 3.53 0 1 1 0-7.059 3.53 3.53 0 0 1 0 7.059z"/>
                    </svg>
                </slot>
            </button>
        </div>

        <transition name="fade-down">
            <nav class="moreMenu" v-show="menuOpen">
                <div class="static" v-if="displayName || email">
                    <div class="displayName" v-if="displayName">{{displayName}}</div>
                    <div class="email" v-if="email">{{email}}</div>
                </div>
                <template v-for="(link, index) in links">
                    <router-link
                            v-if="link.href"
                            :to="link.href"
                            v-on:[link.event]="link.onClick"
                            :key="`link_${index}`"
                            :class="{static: link.static, nonBreaking: makeTextNonBreaking}"
                    >{{link.title}} <span v-if="link.badge" class="badge-label">{{link.badge}}</span>
                        <span class="callout-text">{{link.calloutText}}</span>
                    </router-link>
                    <a v-else
                            :href="link.href"
                            v-on:[link.event]="link.onClick"
                            :key="`link_${index}_alt`"
                            :class="{static: link.static, nonBreaking: makeTextNonBreaking}"
                    >{{link.title}} <span v-if="link.badge" class="badge-label">{{link.badge}}</span>
                        <span class="callout-text">{{link.calloutText}}</span>
                    </a>
                </template>

                <!-- <a href="#" v-on:click.prevent="deleteSentPrompt" v-show="prompt">Ignore&nbsp;Question</a> -->
            </nav>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { clickOutsideDirective } from '@web/vueDirectives'
    import { ComputedMenuLink, DropdownMenuLink } from "@components/DropdownMenuTypes"
    import Logger from "@shared/Logger";
    import Component from "vue-class-component";
    import { Prop, Watch } from "vue-property-decorator";

    const logger = new Logger("DropdownMenu.vue");

    @Component({
        directives: {
            'click-outside': clickOutsideDirective(),
        }
    })
    export default class DropdownMenu extends Vue {

        @Prop({
            type: Array as () => DropdownMenuLink[],
            required: true,
        })
        items!: DropdownMenuLink[];

        @Prop({ type: Boolean, default: true, })
        makeTextNonBreaking!: boolean;

        @Prop({ type: String, required: false, default: null })
        email!: string | null;

        @Prop({ type: String, default: null })
        displayName!: string | null;

        @Prop({ type: Boolean, default: false })
        hideOnRouteChange!: boolean;

        menuOpen: boolean = false;

        @Watch("$route")
        onRouteChanged() {
            if (this.hideOnRouteChange) {
                this.menuOpen = false;
            }
        }

        get hasCustomButton(): boolean {
            return !!this.$slots['custom-button'];
        }

        get links(): ComputedMenuLink[] {
            const clickHandler = (onClick: ((event: Event | any) => void) | undefined) => {
                if (onClick) {
                    return (event: Event) => {
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
                    calloutText: item.calloutText,
                    static: item.static,
                    badge: item.badge,
                }
            })
        }


        processTitle(input: string): string {
            if (this.makeTextNonBreaking) {
                return input.replace(/\s/g, "&nbsp;")
            } else {
                return input;
            }
        }

        toggleMenu() {
            this.menuOpen = !this.menuOpen;
        }

        closeMenu() {
            this.menuOpen = false;
        }

    }
</script>


<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";
    @import "transitions";

    .dropdown-menu-wrapper {
        position: relative;
        z-index: 1500;
    }

    .dropdown-menu {
        button, a.button {
            align-items: center;
            border: 0;
            display: inline-flex;
            flex-grow: 0;
            margin-right: .8rem;

            svg {
                fill: $darkestGreen;
                height: 3.6rem;
                margin-right: .8rem;
                padding: .4rem;
                width: 3.6rem;
            }

            &.icon {
                padding: 0;

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

            &:focus {
                box-shadow: 0 0 3px 2pt $darkGreen;
                outline: none;
            }

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
        background-color: $darkestGreen;
        border-radius: 6px;
        right: 0;
        padding: .8rem 0;
        position: absolute;
        top: 4rem;
        z-index: 100;

        a {
            background-color: transparent;
            color: $white;
            display: block;
            font-size: 1.6rem;
            padding: .8rem 2.4rem;
            text-decoration: none;
            transition: background-color .2s ease-in-out;

            &:hover {
                background-color: lighten($darkestGreen, 5%);
                cursor: pointer;
            }

            &.nonBreaking {
                white-space: nowrap;
            }
        }
    }

    .badge-label {
        @include trialBadge;
        margin-left: .4rem;
    }

    .callout-text {
        color: $green;
        font-size: 1.4rem;
        margin-left: .8rem;
    }

    .static {
        border-bottom: 1px solid lighten($darkestGreen, 5%);
        color: $lightGreen;
        font-size: 1.6rem;
        margin-bottom: .8rem;
        padding: .8rem 2.4rem 1.6rem;

        .displayName {
            color: $white;
            opacity: .9;
            white-space: nowrap;
        }

        &:empty {
            display: none;
        }
    }
</style>
