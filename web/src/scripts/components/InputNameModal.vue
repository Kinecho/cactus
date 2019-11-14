<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
            v-if="member"
    >
        <div slot="body" class="modalContainer">
            <h2>What's your name?</h2>
            <p>Your name is shown on notes you share and to people you invite.</p>
            <div class="item">
                <label for="fname" class="label">First Name</label>
                <input v-model="member.firstName" type="text" name="fname">
            </div>
            <div class="item">
                <label for="lname" class="label">Last Name</label>
                <input v-model="member.lastName" type="text" name="lname">
            </div>
            <button class="item save" @click="save">Save</button>
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
    @import "forms";

    .modalContainer {
        @include shadowbox;
        min-height: 34rem;
        padding: 3.2rem;
    }

    h2 {
        margin-top: 1.6rem;
    }

    p {
        margin-bottom: 3.2rem;
        opacity: .8;
    }

    .item {
        margin-bottom: 3.2rem;
    }

    .label {
        display: block;
        font-size: 1.6rem;
        margin-bottom: .4rem;
        opacity: .8;
    }

    input {
        @include textInputAlt;
        width: 100%;
    }

    .save {
        min-width: 16rem;
    }

</style>
