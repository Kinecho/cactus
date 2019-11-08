<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
    >
        <div slot="body" class="modalContainer">
            <h3>What's your name?</h3>
            <p>This will be shown to people you invite or share with.</p>
            <div class="item">
                <label class="label">First Name</label>
                <input v-model="member.firstName">
            </div>
            <div class="item">
                <label class="label">Last Name</label>
                <input v-model="member.lastName">
            </div>
            <div class="save">
                <button @click="save">Save</button>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "@components/Modal.vue";
    import CopyService from '@shared/copy/CopyService';
    import CactusMemberService from '@web/services/CactusMemberService';
    import CactusMember from '@shared/models/CactusMember';
    import {ListenerUnsubscriber} from '@web/services/FirestoreService'

    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            Modal,
        },
        props: {
            showModal: {type: Boolean, default: false},
        },
        beforeMount() {
            this.memberUnsubscriber = CactusMemberService.sharedInstance.observeCurrentMember({
                onData: ({member}) => {
                    this.member = member;
                }
            })
        },
        destroyed() {
            if (this.memberUnsubscriber) {
                this.memberUnsubscriber();
            }
        },
        data(): {
            member: CactusMember | undefined | null,
            memberUnsubscriber: ListenerUnsubscriber | undefined,
        } {
            return {
               member: undefined,
               memberUnsubscriber: undefined, 
            }
        },
        computed: {

        },
        watch: {
            
        },
        methods: {
            async save() {
                if (this.member) {
                    await CactusMemberService.sharedInstance.save(this.member);
                    console.log("Save success");
                    this.$emit('close');
                }
            },
        }
    })
</script>

<style lang="scss" scoped>
    @import "common";
    @import "mixins";
    @import "variables";

    .modalContainer {
        background-color: $white;
        border-radius: 1.2rem;
        min-height: 34rem;
        overflow: hidden;
        width: 30rem;
    }

</style>
