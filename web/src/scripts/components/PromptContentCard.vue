<template>
    <div class="content-card">
        <h4 v-if="content.label">{{content.label}}</h4>
        <p v-if="content.text">{{content.text}}</p>
        <!--    START QUOTE    -->
        <div class="quote-container" v-if="content.quote">
            <div class="avatar-container" v-if="quoteAvatarUrl">
                <img :src="quoteAvatarUrl" :alt="content.quote.authorName"/>
            </div>
            <p class="quote">
                {{content.quote.text}}
            </p>
            <div class="author">
                <strong class="name">{{content.quote.authorName}}</strong>
                <span class="title" v-if="content.quote.authorTitle">{{content.quote.authorTitle}}</span>
            </div>
        </div>
        <!--    END QUOTE    -->

        <!--    START Video -->
        <div class="video-container" v-if="content.video">
            <div v-if="content.video.youtubeEmbedUrl">
                <iframe width="560" height="315" :src="content.video.youtubeEmbedUrl" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <div v-if="content.video.url">
                <video :src="content.video.url" controls></video>
            </div>
        </div>
        <!--    END Video -->

        <!--    START Reflect -->
        <div v-if="isReflectScreen" class="reflect-container">
            <div class="grow-container">
                <img src="/assets/images/cactusPots.svg" alt="Cactus Pots"/>
            </div>
            <input type="text" placeholder="Write your thoughts"/>
        </div>
        <!--    END Reflect-->
        <div class="actions" v-if="content.button">
            <a v-if="isLink" :href="content.button.navigation.href" :target="content.button.navigation.target">{{content.button.label}}</a>
            <button v-if="!isLink" @click="doButtonAction">{{content.button.label}}</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Content, ContentButtonAction, ContentType} from "@shared/models/PromptContent"

    export default Vue.extend({
        props: {
            content: {
                type: Object as () => Content
            },
            hasNext: Boolean,
            hasPrevious: Boolean,
        },
        computed: {
            isLink():boolean {
                return this.content.button && this.content.button.navigation && this.content.button.action === ContentButtonAction.navigate || false
            },
            quoteAvatarUrl():string|undefined|null {
                if (!this.content.quote || !this.content.quote.avatarImage){
                    return undefined;
                }

                return this.content.quote.avatarImage.url;
            },
            isReflectScreen():boolean{
                return this.content.contentType === ContentType.reflect
            }
        },
        methods: {
            doButtonAction():void{
                if (!this.content.button){
                    return;
                }

                const action:ContentButtonAction = this.content.button.action;
                switch (action){
                    case ContentButtonAction.next:
                        this.next();
                        break;
                    case ContentButtonAction.previous:
                        this.previous();
                        break;
                    case ContentButtonAction.complete:
                        this.complete();
                        break;
                    case ContentButtonAction.navigate:
                        if (this.content.button.navigation){
                            alert(`Navigate to some page: ${this.content.button.navigation.href}`)
                        }
                        break;
                }

            },
            next(){
                this.$emit("next")
            },
            previous(){
                this.$emit("previous");
            },
            complete(){
                this.$emit("complete")
            }
        }
    })
</script>

<style lang="scss" scoped>
    .content-card {

    }
</style>