<template>
    <div>
        <h2>Confirmed....?</h2>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { FirebaseUser, getAuth } from "@web/firebase";

    export default Vue.extend({
        name: "SignupConfirmed",
        beforeMount(): void {
            this.authListener = getAuth().onAuthStateChanged(async (user) => {
                this.user = user;
                if (!this.authLoaded) {
                    // const response = handleEmailLinkSignIn();
                }
                this.authLoaded = true;

            })
        },
        data(): {
            authLoaded: boolean,
            authListener: any,
            user: FirebaseUser | null,
        } {
            return {
                authLoaded: false,
                authListener: undefined,
                user: null,
            }
        }
    })
</script>

<style scoped lang="scss">

</style>