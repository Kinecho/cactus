<template>
    <modal :show="showModal"
            v-on:close="$emit('close')"
            :showCloseButton="true"
            v-if="member"
    >
        <div slot="body" class="modalContainer">
            <h2>Are you sure?</h2>
            <p>This action is <strong>irreversable</strong> and will permanently delete on your Cactus data, including all your typed journal entries. If you are 100% sure, type the e-mail address associated with your account to unlock the delete button.</p>
            <div class="item">
                <label for="emailConfirm" class="label">Type Account Email Address</label>
                <input v-model="confirmedEmail" type="text" name="emailConfirm">
            </div>
            <button :disabled="isDeleting" class="item delete" v-if="isConfirmed" @click="deleteAccount">Delete Account</button>
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
    import {deleteCurrentUserPermanently} from '@web/user';
    import {logout} from '@web/auth'
    import Logger from "@shared/Logger";
    const logger = new Logger("DeleteAccountModal.vue");
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
            confirmedEmail: string,
            isDeleting: boolean
        } {
            return {
               member: undefined,
               memberUnsubscriber: undefined,
               confirmedEmail: '',
               isDeleting: false
            }
        },
        computed: {
          isConfirmed(): boolean {
            return (this.member?.email === this.confirmedEmail)
          }
        },
        methods: {
            async deleteAccount() {
                if (this.member?.email === this.confirmedEmail) {
                    this.isDeleting = true;
                    const result = await deleteCurrentUserPermanently();
                    if (result.success) {
                        logger.log("Delete success");
                        await logout();
                    } 
                    this.isDeleting = false;
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
