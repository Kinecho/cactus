<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="SocialFindFriends">
      <!-- find your friends -->
        <div class="findFriends">
            <h1>Find Your Friends</h1>
            <p class="subtext">Invite people you know to join and reflect with you. Your reflections are always private unless you specifically share them.</p>
            <button class="primary">Share your Invite Link</button>

            <!-- if not imported -->
            <div class="results" v-if="!importedContacts">
                <h2>Import from...</h2>
                <div class="btnContainer">
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="gmail">Gmail</button>
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="yahoo">Yahoo</button>
                </div>
                <p class="subtext">Don't worry, you'll choose who to connect with before they're invited.</p>
                <!-- end -->
            </div>

            <div class="results" v-if="importedContacts">
                <h2>{{importedService}} Contacts <span class="resultCount">({{importedContacts.length}})</span></h2>
                <div class="contactCards" v-for="contact in importedContacts">
                    <SocialImportedContact v-bind:contact="contact"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AddressBookService from '@web/services/AddressBookService'
    import SocialImportedContact from "@components/SocialImportedContact.vue"
    import {EmailService} from "@shared/types/EmailContactTypes";

    export default Vue.extend({
        components: {
            SocialImportedContact
        },
        created() {
            AddressBookService.sharedInstance.start();
        },
        mounted() {
            this.configureCloudsponge();
        },
        destroyed() {
            
        },
        data(): {
            importedContacts: Array<any> | undefined,
            importedService: string | undefined            
        } {
            return {
              importedContacts: undefined,
              importedService: undefined              
            }
        },
        methods: {
            importContacts: function(contacts: Array<any>, source: string) {
                this.importedContacts = AddressBookService.sharedInstance.formatContacts(contacts);
                this.importedService = EmailService[source as keyof typeof EmailService];
            },
            configureCloudsponge: function() {
                if (window.cloudsponge) {
                    window.cloudsponge.init({
                        afterSubmitContacts: this.importContacts
                    });
                } else {
                    setTimeout(this.configureCloudsponge, 500);
                }
            }
        },
        computed: {
        }
    })
</script>
