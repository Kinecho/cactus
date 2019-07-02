<template lang="html">
    <header>
        <a href="/"><img class="logo" src="assets/images/logo.svg" alt="Cactus logo"/></a>
        <a v-if="!loggedIn" class="jump-to-form button" data-scroll-to="signupAnchor" data-focus-form="sign-up-top" type="button">Sign
            Up Free</a>
        <div v-if="loggedIn">
            <span >{{username}}</span>&nbsp;<a href="#" @click=logout>logout</a>
        </div>

    </header>
</template>

<script>
    import * as firebase from 'firebase/app'
    import 'firebase/auth'



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
            async logout() {
                console.log("Logging out...");
                await this.$auth.signOut();
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>