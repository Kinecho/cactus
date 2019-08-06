import Vue, {DirectiveOptions} from "vue";

export function clickOutsideDirective():DirectiveOptions{
    return {
        bind: function (el, binding, vNode) {
            // Provided expression must evaluate to a function.
            if (typeof binding.value !== 'function') {
                let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
                const compName = vNode.context ? vNode.context.$options.name : undefined;
                if (compName) {
                    warn += `Found in component '${compName}'`
                }

                console.warn(warn)
            }
            // Define Handler and cache it on the element
            const bubble = binding.modifiers.bubble;
            const handler = (e:any) => {
                if (bubble || (!el.contains(e.target) && el !== e.target)) {
                    binding.value(e)
                }
            };

            el.__vueClickOutside__ = handler;

            // add Event Listeners
            document.addEventListener('click', handler)
        },

        unbind: function (el, binding) {
            // Remove Event Listeners
            if (el.__vueClickOutside__){
                document.removeEventListener('click', el.__vueClickOutside__);
                el.__vueClickOutside__ = null
            }
        }

    }
}

// export function configureDirectives() {
//     Vue.directive('click-outside', clickOutsideDirective())
// }