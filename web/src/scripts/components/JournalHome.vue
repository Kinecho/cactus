<template>
    <div>
        <NavBar :show-signup="true"/>
        <div>
            <h1>Hello Journal {{ userName }}, {{ email }}</h1>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import NavBar from '@components/NavBar.vue'
    import {getAuth, FirebaseUser} from '@web/firebase'


    declare interface JournalHomeData {
        user?: FirebaseUser | null,
        authUnsubscribe?: () => void,
    }

    export default Vue.extend({
        created() {
            this.authUnsubscribe = getAuth().onAuthStateChanged(user => {
                this.user = user;
            })
        },
        components: {NavBar},
        data(): JournalHomeData {
            return {
                user: null,
                authUnsubscribe: undefined,
            };
        },
        beforeDestroy(){
          if (this.authUnsubscribe){
              this.authUnsubscribe();
          }
        },
        computed: {
            userName(): string | undefined | null {
                return this.user ? this.user.displayName : null;
            },
            email(): string | undefined | null {
                return this.user ? this.user.email : null;
            }
        }
    })
</script>