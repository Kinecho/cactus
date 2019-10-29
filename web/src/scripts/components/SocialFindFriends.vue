<template xmlns:v-clipboard="http://www.w3.org/1999/xhtml">
    <div class="SocialFindFriends">
      <!-- find your friends -->
        <div class="findFriends">
            <h1>Find Your Friends</h1>
            <p class="subtext">Invite people you know to join and reflect with you. Your reflections are always private unless you specifically share them.</p>
            <button class="primary">Share your Invite Link</button>

            <!-- if not imported -->
            <div class="results" v-if="!importedContacts">
                <h2>Import Your Contacts</h2>
                <p class="subtext">Import your contacts from email. Don't worry, you'll choose who to connect with before they're invited.</p>
                <div class="btnContainer">
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="gmail">Gmail</button>
                    <button class="secondary small cloudsponge-launch" data-cloudsponge-source="yahoo">Yahoo</button>
                    <textarea class="cloudsponge-contacts"></textarea>
                </div>
                <!-- end -->
            </div>

            <div class="results" v-if="importedContacts">
                <h2>Import Your Contacts <span class="resultCount">({{importedContacts.length}})</span></h2>
                <div class="contactCards" v-for="contact in importedContacts">
                    <div class="contactCard">
                        <div class="avatar">
                            <img src="https://placekitten.com/44/44" alt="User avatar"/>
                        </div>
                        <div class="contactInfo">
                            <p class="name">{{contact.first_name}} {{contact.last_name}}</p>
                            <p class="email">{{contact.email}}</p>
                        </div>
                        <button class="secondary small">Invite</button>
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
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AddressBookService from '@web/services/AddressBookService'

    export default Vue.extend({
        components: {

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
            importedContacts: Array<any> | undefined            
        } {
            return {
              importedContacts: undefined              
            }
        },
        methods: {
            importContacts: function(contacts: Array<any>) {
                this.importedContacts = AddressBookService.sharedInstance.formatContacts(contacts);
                console.log(this.importedContacts);
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
