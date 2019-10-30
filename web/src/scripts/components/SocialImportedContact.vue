<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="contactCard">
        <div class="avatar">
            <img :src="'https://i.pravatar.cc/44?u=' + contact.email" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">{{contact.first_name}} {{contact.last_name}}</p>
            <p class="email">{{contact.email}}</p>
        </div>
        <button class="secondary small" @click.prevent="">Invite</button>
    </div>
    <!--
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Add Friend</button>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Requested</button>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <p class="friendsStatus">
            <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path fill="#FDBCA3" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
            Friends
        </p>
    </div>
    <div class="contactCard">
        <div class="avatar">
            <img src="https://placekitten.com/44/44" alt="User avatar"/>
        </div>
        <div class="contactInfo">
            <p class="name">James Brown</p>
            <p class="email">james@brown.com</p>
        </div>
        <button class="secondary small">Invited</button>
    </div>-->
</template>

<script lang="ts">
    import Vue from "vue";
    import {EmailContact} from "@shared/types/EmailContactTypes";

    export default Vue.extend({
        props: {
            contact: EmailContact
        },
        components: {

        },
        created() {
        },
        mounted() {
        },
        destroyed() {
            
        },
        
        data(): {
            readyToInvite: boolean      
        } {
            return {
              readyToInvite: false             
            }
        },
        methods: {
        },
        computed: {
        }
    })
</script>
