<template lang="html">
    <header v-bind:class="{loggedIn: loggedIn}">
        <a href="/"><img class="logo" src="assets/images/logo.svg" alt="Cactus logo"/></a>
        <a v-if="!loggedIn" class="jump-to-form button" data-scroll-to="signupAnchor" data-focus-form="sign-up-top" type="button">Sign
            Up Free</a>
        <div v-if="loggedIn">
            <span >{{username}}</span>&nbsp;<a href="#" @click.prevent=logout>logout</a>
        </div>

    </header>
</template>

<script>
    import {initializeFirebase} from '@web/firebase'
    const firebase = initializeFirebase();

    export default {
        created: function () {
            const auth = firebase.auth();
            this.$auth = auth;
            this.authHandler = this.$auth.onAuthStateChanged(user => {
                if (user) {
                    console.log('user is logged in', user.toJSON())
                    this.loggedIn = true
                    this.username = user.email || user.displayName || user.phoneNumber


                } else {
                    console.log('User is logged out')
                    this.loggedIn = false
                    this.username = '';
                }
            })
        },
        data() {
            return {
                username: '',
                loggedIn: false,
            }
        },
        methods: {
            async logout(e) {
                // e.prev
                console.log("Logging out...");
                await this.$auth.signOut();
                window.location.href = "/";
            }
        }
    }
</script>

<style lang="scss" scoped>
header {
    &.loggedIn {
        display: flex;
        justify-content: space-between;
    }

}
</style>