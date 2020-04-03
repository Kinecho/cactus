<template>
    <div v-if="processedContent" :class="['content-card', `type-${processedContent.contentType}`, processedContent.backgroundImage ? processedContent.backgroundImage.position : '', {reflectScreen: isReflectScreen}]">
        <section class="content">
            <div v-if="processedContent.text" class="text">
                <a v-if="processedContent.showElementIcon" class="element-container" @click.prevent="showCactusModal(cactusElement)">
                    <div class="element-icon">
                        <img :src="'/assets/images/cacti/' + cactusElement + '-3.svg'" alt=""/>
                    </div>
                    <h4 class="label">{{cactusElement}}</h4>
                </a>
                <h4 v-if="processedContent.label" class="label">{{processedContent.label}}</h4>
                <h2 v-if="processedContent.title" class="title">{{processedContent.title}}</h2>
                <p :class="{tight: isShareNoteScreen}">
                    <MarkdownText :source="processedContent.text"/>
                </p>
            </div>

            <!--  START SHARE_NOTE -->
            <div v-if="isShareNoteScreen">
                <shared-reflection-card :response="response"/>

                <transition name="fade-in" mode="out-in">
                    <div v-if="shareableLinkUrl" class="share-note-link-container">
                        <transition name="snack" appear>
                            <snackbar-content :autoHide="true" v-if="linkCreated">
                                <svg slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13">
                                    <path fill="#29A389" d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/>
                                </svg>
                                <span slot="text">Shareable link created</span>
                            </snackbar-content>
                        </transition>
                        <p class="directLink">Here's your direct link to share:</p>
                        <copy-text-input v-if="shareableLinkUrl" :text="shareableLinkUrl" :queryParams="shareableLinkParams" :editable="false" buttonStyle="primary"/>
                        <div v-if="nativeShareEnabled" class="sharing">
                            <button class="btn secondary" @click="shareNatively()">
                                <img class="shareIcon" src="/assets/images/share.svg" alt="Share Icon"/>Share
                            </button>
                        </div>
                    </div>
                    <button v-else class="button primary getLink"
                            :disabled="creatingLink"
                            :class="{loading: creatingLink}"
                            @click="createSharableLink">
                        {{creatingLink ? 'Creating' : 'Get Shareable Link'}}
                    </button>


                </transition>
            </div>
            <!--  END SHARE_NOTE -->

            <!--    START QUOTE    -->
            <div class="quote-container" v-if="processedContent.quote">
                <div class="avatar-container" v-if="quoteAvatar">
                    <flamelink-image v-bind:image="quoteAvatar" v-bind:width="60"/>
                </div>
                <div class="quote">
                    <MarkdownText :source="processedContent.quote.text" :treatment="'quote'" />
                </div>
                <div class="author">
                    <p class="name">{{processedContent.quote.authorName}}</p>
                    <p class="title" v-if="processedContent.quote.authorTitle">
                        {{processedContent.quote.authorTitle}}</p>
                </div>
            </div>
            <!--    END QUOTE    -->

            <!--    START Video -->
            <div class="video-container" v-if="processedContent.video">
                <div v-if="processedContent.video.youtubeVideoId" class="iframe-wrapper">
                    <div class="loading" v-if="youtubeVideoLoading">
                        <spinner message="Loading Video..."/>
                    </div>
                    <iframe v-on:load="youtubeVideoLoading = false" width="320" height="203" :src="`https://www.youtube.com/embed/${processedContent.video.youtubeVideoId}`" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div v-if="processedContent.video.url">
                    <video :src="processedContent.video.url" controls></video>
                </div>
            </div>
            <!--    END Video -->

            <!--      START Photo      -->
            <div class="photo-container" v-if="processedContent.photo">
                <flamelink-image v-bind:image="processedContent.photo"/>
            </div>
            <!--      END Photo      -->

            <!--    START AUDIO     -->
            <div class="audio-container" v-if="processedContent.audio">
                <audio controls :src="processedContent.audio.url"/>
            </div>
            <!--    END AUDIO     -->

            <!--      START Link      -->
            <div class="link-container" v-if="processedContent.link">
                <a :href="linkDestinationUrl"
                        :target="processedContent.link.linkTarget"
                        :class="linkClasses">{{processedContent.link.linkLabel}}</a>
            </div>
            <!--      END Link      -->


            <!--     ADD CONTENT ACTION       -->
            <div class="link-container" v-if="showActionButton">
                <button :class="actionButtonClasses" @click="doButtonAction">{{processedContent.actionButton.label}}</button>
            </div>


            <!--    START Elements  -->
            <prompt-content-card-elements v-if="processedContent.elements"/>
            <!--    END Elements    -->

            <!--    START Invite Friend  -->
            <prompt-content-card-invite-friend
                    v-if="processedContent.invite"
                    @skip="next()"
                    @disableNavigation="disableNavigation()"/>
            <!--    END Invite Friend    -->

            <!--    START Grow -->
            <div class="grow-container" v-if="isReflectScreen">
                <svg v-if="cactusElement === 'experience'" class="grow5 experience" viewBox="0 0 69 122" xmlns="http://www.w3.org/2000/svg">
                    <g class="leaf1" fill="none" fill-rule="evenodd">
                        <path d="M21.915 39.468c-3.121-2.465-4.809-5.92-5.294-9.948-.436-3.607.394-7.23.754-10.847.358-3.617.156-7.55-2.012-10.449-.547-.733-1.232-1.393-2.081-1.72-1.575-.607-3.358.049-4.764.987-4.06 2.71-6.375 7.684-6.512 12.6-.265 9.602 8.174 21.837 12.348 24.193-.946.96 10.532-5.897 7.561-4.816z" fill="#07454C"/>
                        <path d="M4.179 8.917l3.058 5.544-6.04-.164 2.982-5.38zM15.433 25.402l-1.24 6.203-4.52-3.988 5.76-2.215z" stroke="#33CCAB"/>
                    </g>
                    <g class="leaf2" fill="none" fill-rule="evenodd">
                        <path d="M47.088 48.844c5.473-3.72 9.343-9.406 11.507-15.724 2.24-6.54 2.465-13.71 1.064-20.484-.74-3.58-2.007-7.201-4.587-9.768C52.494.303 48.34-.914 45.14.79c-3.712 1.979-4.8 6.933-4.263 11.14.538 4.207 2.261 8.216 2.518 12.45.347 5.773-2.281 11.637-6.762 15.22" fill="#07454C"/>
                        <path d="M53.527 36.04l3.98 4.932-5.977.882 1.997-5.813zM46.433 28.402l-1.24 6.203-4.52-3.988 5.76-2.215zM50.49 7.092l1.148 6.664-6.665-2.356 5.516-4.308zM61.49 18.092l1.148 6.664-6.665-2.356 5.516-4.308z" stroke="#33CCAB"/>
                    </g>
                    <g class="leaf5" fill="none" fill-rule="evenodd">
                        <path d="M66.37 44.225c-1.212-.26-2.357.624-3.22 1.525-2.317 2.421-4.039 5.366-6.307 7.836a23.203 23.203 0 01-9.572 6.242c.377-2.556-3.35 20.444-2.55 15.615 6.415-1.512 12.667-4.253 17.363-8.902 4.954-4.905 7.935-12.17 6.595-19.05-.27-1.394-.935-2.972-2.309-3.266z" fill="#07454C"/>
                        <path d="M62.49 59.092l1.148 6.664-6.665-2.356 5.516-4.308z" stroke="#33CCAB"/>
                    </g>
                    <g class="leaf7" fill="none" fill-rule="evenodd">
                        <path d="M48.437 57.3c.399-2.647 1.037-7.332 0-12.933C47.144 39.31 41.176 34 29.83 34c-11.348 0-17.852 7.755-18.488 9.007-2.206 4.342-1.25 9.536-.245 14.294l6.173 29.225L43.405 87c.843-5.078 4.839-26.889 5.032-29.7z" fill="#07454C"/>
                        <path d="M12.527 62.04l3.98 4.932-5.977.882 1.997-5.813zM29.179 40.917l3.058 5.544-6.04-.164 2.982-5.38zM29.433 59.402l-1.24 6.203-4.52-3.988 5.76-2.215zM20.067 78.073l4.78 4.168-5.732 1.901.952-6.07zM40.092 73.51l6.664-1.148-2.356 6.665-4.308-5.516zM42.49 55.092l1.148 6.664-6.665-2.356 5.516-4.308zM15.49 47.092l1.148 6.664L9.973 51.4l5.516-4.308z" stroke="#33CCAB"/>
                    </g>
                    <g>
                        <path d="M52 79v6.798h-1.775l-4.832 29.337-31.785.122-4.86-29.459H7V79h45z" fill="#1F3B7A"/>
                        <path fill-opacity=".05" fill="#000" d="M9.288 88.064h40.424l.763-2.266H8.525z"/>
                    </g>
                </svg>
                <svg v-else-if="cactusElement === 'meaning'" class="grow5 meaning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43 122">
                    <g class="stem1" fill="none" fill-rule="evenodd">
                        <path fill="#29A389" d="M19.911.183C19.352.145 5.971.585 3.37 13.673c-2.675 13.454 0 65.91 0 65.91L37.035 80c.9-12.584 1.161-52.873-1.514-66.326C32.918.584 19.927.186 19.91.184z"/>
                        <path stroke="#000" stroke-opacity=".2" d="M7.113 30.843l2.869 4.319 3.232-4M28.113 29.843l2.869 4.319 3.232-4M18.685 23.562l3.767 3.563 2.25-4.624M10.685 11.562l3.767 3.563 2.25-4.624M21 39l3.091 4.163L27.109 39M9.234 47.692l2.64 4.463 3.436-3.824M24.234 7.692l2.64 4.463 3.436-3.824M7.113 64.843l2.869 4.319 3.232-4M18.685 57.562l3.767 3.563 2.25-4.624M21 73l3.091 4.163L27.109 73"/>
                    </g>
                    <g class="stem3" fill="none" fill-rule="evenodd">
                        <path fill="#33CCAB" d="M40.15 53.13c-1.863-10.604-9.655-10.118-9.665-10.12-.4-.03-7.772-.484-9.634 10.12-1.915 10.9 0 28.285 0 28.285l9.61 1.572V83l.038-.007.038.007v-.013l9.612-1.572s1.915-17.385 0-28.285"/>
                        <path stroke="#000" stroke-opacity=".2" d="M31.82 60.46l3.091 4.163 3.018-4.163M24.82 49.46l3.091 4.163 3.018-4.163M24.82 72.46l3.091 4.163 3.018-4.163"/>
                    </g>
                    <path fill="#294FA3" d="M42.205 79s1.07 16.504-2.6 24.258c0 0-4.311 11.742-11.026 11.742H14.002c-6.715 0-11.025-11.742-11.025-11.742C-.692 95.504.53 78.982.602 79h41.603z"/>
                    <path fill="#000" fill-rule="nonzero" d="M28.906 81c6.199 15.186-.755 32.185-8.944 32.185-4.535.54-6.322.811-5.36.815h14.304c8.37-1.467 12.886-23.251 11.03-32.957L28.907 81z" opacity=".15"/>
                </svg>
                <svg v-else-if="cactusElement === 'relationships'" class="grow5 relationships" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109 122">
                    <path class="leaf1" fill="#29A389" d="M69.05 38.815C70.652 29.978 54.303.624 54.303.624s2.922 28.8-1.086 45.468l-1.977 9.852 6.773 19.291 11.147-26.611-.112-9.81z"/>
                    <path class="leaf2" fill="#07454C" d="M62.58 77.7C49.122 52.45 26.67 4.26 26.67 4.26s4.937 38.418 11.309 55.82c0 0 6.645 25.01 13.402 32.421l9.956 5.817 5.336-8.005L62.58 77.7z"/>
                    <path class="leaf2" fill="#07454C" d="M57.287 81.69C43.111 52.656.287 41 .287 41S33.335 68.822 37.43 83l19.857-1.31z"/>
                    <path class="leaf3" fill="#33CCAB" d="M64.082 64.063c9.227-13.545 23.273-23.87 39.034-28.495-1.772.967-23.058 20.26-30.395 38.13l-3.084 11.484-17.453 12.72 2.993-33.39 8.905-.449z"/>
                    <path class="leaf4" fill="#07454C" d="M71.446 51.157c5.439-12.773 3.824-23.292 2.778-36.606-.225-2.863.32-8.55.32-8.55s-4.566 17.294-8.255 25.014c-4.08 8.538-9.871 11.69-11.168 22.35l-.834 9.647 3.47 19.901L60.462 85l10.984-33.843z"/>
                    <path class="leaf5" fill="#29A389" d="M53.719 96.937C48.037 55.731 100.287 6 100.287 6s-5.289 8.91-7.72 13.107C78.689 43.077 73.127 70.29 69.417 98"/>
                    <path class="leaf5" fill="#29A389" d="M56.287 84.49c-4.028-16.303-12.282-31.499-23.7-43.622-2.225-2.364-4.572-4.615-7.104-6.632C21.763 31.276 13.287 27 13.287 27s21.286 27.902 25.24 44.591l.285 8.365L44.197 85l12.09-.51z"/>
                    <path class="leaf6" fill="#07454C" d="M73.006 87c6.171-17.357 19.183-33.233 35.281-42-9.61 3.614-18.924 8.172-27.204 14.27-8.28 6.097-10.829 8.793-16.896 16.904l-4.9 9.699L73.006 87z"/>
                    <path class="leaf7" fill="#33CCAB" d="M50.98 6S40.288 28.533 40.288 44.89c0 10.905 4.113 27.225 12.34 48.961l13.66.15-1.691-13.94c.67-28.436-13.615-74.06-13.615-74.06z"/>
                    <g fill="none" fill-rule="evenodd">
                        <path fill="#5C82D6" d="M78.438 78.841c-15.09-.535-44.972.01-44.972.01s-.389 14.625 1.742 20.412c1.867 5.07 4.545 9.502 10.446 12.633 6.545 3.473 14.022 3.473 20.567 0 5.901-3.131 8.58-7.563 10.447-12.633 2.13-5.787 1.742-20.412 1.742-20.412s-29.884-.545-44.972-.01"/>
                        <path fill="#000" fill-rule="nonzero" d="M69.196 80.685c0 20.954-3.828 31.167-11.485 30.64.418.24 1.344.36 2.777.36 3.846 0 14.908-.998 14.908-31h-6.2z" opacity=".05"/>
                    </g>
                </svg>
                <svg v-else-if="cactusElement === 'emotions'" class="grow5 emotions" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 121">
                    <g class="stem2">
                        <path fill="#0D7F8C" d="M23.524 83.962c-12.927-4.212-5.517-4.063-3.436-8.806.532-1.212-2.906 1.418-4.888.452-.746-.364 3.083-5.442 3.22-5.912.911-3.153-8.512.109-6.232-3.827.702-1.213 4.703-2.22 3.503-2.925-5.331-1.124-7.951-2.658-7.86-4.6.137-2.912 1.85-1.815 2.71-3.687 1.389-3.026-7.657-.082-5.018-4.73 1.447-2.55 4.785-3.054.254-6.335-1.656-1.2-3.545-.844-4.088-2.8-.463-1.67 2.54-.608 2.66-2.345.226-3.253-3.73-5.804-3.551-9.06.08-1.47 2.699-2.155 4.148-1.8 2.317.569 3.412 3.514 5.689 4.213 1.27.39 2.525-1.612 3.817-1.295 2.986.733-.451 5.815.056 6.307.901.874 3.008-2.427 3.62-1.337 1.142 2.035-1.313 4.863-.43 7.022.394.963 5.046-2.517 6.084.052.692 1.713.372 4.868-.962 9.465 1.398 1.336 4.1-.753 5.917-.036 4.312 1.703-3.19 7.604.507 9.691 1.106.624 2.626-1.194 3.795-.778 3.811 1.358-5.05 5.592-.484 7.558 1.436.619 3.313-1.664 4.672-.898 2.86 1.614.07 7.557-.825 8.77"/>
                        <path fill="#29A389" d="M3.459 27.746c-1.851 4.591 1.332 8.248 4.575 8.605.937.104-2.604.886-3.013 3.05-.153.815 5.549 2.236 5.957 2.52 2.733 1.906-4.769 5.857-.728 7.439 1.246.488 4.162-1.496 4-.088-2.143 4.63-2.502 7.697-1.078 9.2 2.136 2.252 2.303.171 4.101 1.08 2.907 1.471-4.16 5.414.582 7.32 2.6 1.046 4.797-.879 4.621 4.932-.064 2.125-1.357 3.157-.272 5.114.925 1.67 1.83-1.285 3.125.032 2.425 2.467 2.05 7.287 4.45 9.788 1.085 1.13 3.013-.147 3.56-1.446.584-1.384-2.977-9.684-10.682-24.899-4.443-9.432-7.392-15.434-8.847-18.008-2.758-4.88-6.208-9.76-10.351-14.64z"/>
                    </g>
                    <path class="stem3" fill="#0D7F8C" d="M38.272 81.618c-5.018-9.11-.96-5.159 2.677-6.734.93-.403-2.362-.72-2.964-2.297-.226-.594 4.56-1.445 4.882-1.638 2.154-1.293-4.808-4.38-1.481-5.399 1.025-.314 3.783 1.21 3.482.187-2.39-3.413-3.052-5.64-1.988-6.682 1.597-1.563 1.98-.054 3.437-.655 2.355-.973-4.23-4.042-.332-5.274 2.138-.675 4.264.785 3.448-3.421-.3-1.538-1.539-2.324-.821-3.705.612-1.178 1.735.985 2.709.073 1.823-1.708.946-5.204 2.744-6.937.812-.782 2.632.2 3.255 1.155.997 1.528.071 3.752.977 5.332.506.882 2.25.414 2.806 1.266 1.285 1.97-3.285 3.027-3.26 3.568.047.961 2.946.208 2.719 1.14-.425 1.737-3.27 2.042-3.904 3.715-.283.746 4.13 1.22 3.368 3.204-.507 1.323-2.333 2.926-5.476 4.81.083 1.478 2.682 1.716 3.322 3.067 1.518 3.206-5.749 2.602-4.774 5.702.29.928 2.088.7 2.523 1.544 1.42 2.751-5.736.502-4.214 3.988.48 1.097 2.718.796 3.076 1.934.755 2.399-3.904 4.277-5.036 4.49"/>
                    <g class="stem1">
                        <path fill="#33CCAB" d="M23.748 84c-13.018-13.506-4.15-8.608 1.304-13.24 1.395-1.183-4.392-.066-6.188-2.54-.677-.931 7.1-4.872 7.556-5.376 3.057-3.378-10.358-5.274-5.162-8.766 1.602-1.076 7.062.205 6.049-1.444-5.749-4.801-7.966-8.392-6.652-10.772 1.972-3.569 3.362-1.103 5.561-2.906 3.556-2.917-9.205-4.971-3.133-9.13 3.33-2.28 7.678-.79 4.234-7.791-1.26-2.56-3.763-3.314-3.207-6.114.475-2.39 3.448.852 4.67-1.252 2.289-3.942-.913-9.66 1.321-13.632 1.009-1.794 4.6-.99 6.131.377 2.45 2.187 1.947 6.58 4.267 8.905 1.293 1.297 4.051-.417 5.417.802 3.156 2.818-4.15 7.013-3.841 7.953.547 1.67 5.14-1.134 5.204.624.119 3.28-4.601 5.27-4.872 8.541-.121 1.46 7.66.048 7.323 3.935-.225 2.59-2.568 6.347-7.03 11.27.861 2.566 5.424 1.662 7.176 3.717 4.158 4.88-8.57 7.518-5.394 12.49.95 1.486 3.914.17 5.07 1.435 3.766 4.128-9.571 3.81-5.27 9.181 1.353 1.69 5.037.017 6.204 1.843 2.458 3.844-4.6 9.531-6.432 10.484"/>
                        <path fill="#29A389" d="M33.847 0c4.729 4.034 3.364 10.014 0 12.343-.97.672 3.388-.558 5.106 1.619.646.82-4.803 5.798-5.086 6.358-1.894 3.756 8.683 3.714 5.158 7.886-1.086 1.286-5.46.802-4.457 2.28 5.073 3.903 7.265 7.118 6.576 9.644-1.034 3.79-2.437 1.562-3.885 3.648-2.34 3.373 7.755 3.58 3.647 8.53-2.252 2.716-5.8 1.87-2.202 8.263 1.315 2.337 3.344 2.723 3.295 5.555-.042 2.418-2.768-.348-3.423 1.894-1.227 4.2 2.01 9.367.83 13.59-.533 1.908-3.405 1.628-4.768.5-1.454-1.2-2.393-12.598-2.817-34.191-.63-13.188-.897-21.653-.802-25.396C31.199 15.427 32.14 7.92 33.847 0z"/>
                    </g>
                    <g>
                        <path fill="#5C82D6" d="M12 78l9.959 34.968S25.956 114 35.664 114c9.707 0 12.856-1.03 12.856-1.03L58 78"/>
                    </g>
                </svg>
                <svg v-else class="grow5 energy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 150">
                    <path fill="#294FA3" d="M36.558 93.048c-2.856 5.572-4.042 10.838-4.476 17.084-.436 6.246.852 12.71 4.268 17.958 4.256 6.544 11.472 10.716 18.99 12.83 7.426 2.088 15.22 2.378 22.934 2.606 7.712-.228 15.506-.518 22.932-2.606 7.518-2.114 14.734-6.286 18.992-12.83 3.416-5.248 4.704-11.712 4.268-17.958-.436-6.246-2.96-13.03-5.812-18.604C112.608 79.728 96.084 74 79.232 74c-17.934.002-36.24 6.488-42.674 19.048"/>
                    <path fill="#000" d="M94 82c22.54 26.762 25.36 52-18.43 58.49-7.318 1-10.2 1.502-8.646 1.51H82.61C136 140.49 124.548 98.874 110 82H94z" opacity=".05"/>
                    <ellipse cx="79" cy="83" fill="#000" opacity=".407" rx="31" ry="5"/>
                    <g class="leaf1">
                        <path fill="#2DB799" d="M119.242 21.576c-5.322 1.518-10.926 2.062-16.074 4.092-5.15 2.03-10.016 6.042-10.946 11.5l-1.496 3.426 8.694 20.05h8.648l13.312-3.274c5.656-5.51 7.758-13.712 8.536-21.57.782-7.858.506-15.88 2.498-23.52-2.47 4.952-7.848 7.778-13.172 9.296"/>
                        <path fill="#29A389" d="M130.466 19.014c-14.64 33.062-32.65 47.42-54.01 42.898a.5.5 0 0 1 .208-.98c20.796 4.408 38.416-9.64 52.888-42.32a.5.5 0 0 1 .914.404v-.002z"/>
                    </g>
                    <g class="leaf2">
                        <path fill="#2DB799" d="M23.744 35.8c.78 7.858 2.882 16.06 8.536 21.57l13.312 3.274h8.648l8.694-20.05-1.494-3.426c-.932-5.458-5.798-9.47-10.948-11.5-5.148-2.03-10.752-2.574-16.074-4.092-5.322-1.518-10.702-4.344-13.172-9.296 1.994 7.64 1.716 15.662 2.498 23.52"/>
                        <path fill="#29A389" d="M23.534 19.014c14.64 33.062 32.65 47.42 54.01 42.898a.5.5 0 0 0-.208-.98c-20.796 4.408-38.416-9.64-52.888-42.32a.5.5 0 0 0-.914.404v-.002z"/>
                    </g>
                    <g class="leaf3">
                        <path fill="#30C1A2" d="M42.688 42.818c-.822 13.026 16.01 28.2 16.01 28.2 13.092-9.848 12.556-32.89 12.556-32.89.912-5.376-.67-7.104-3.266-11.396-2.596-4.288-5.97-7.77-8.826-11.806C56.31 10.89 53.908 6.008 53.846.57c-5.19 13.65-10.222 27.446-11.158 42.248"/>
                        <path fill="#29A389" d="M53.3 4.264c-.072 36.16 10.54 56.6 31.894 61.156a.5.5 0 0 0 .208-.978c-20.79-4.434-31.174-24.436-31.1-60.174a.5.5 0 0 0-1-.004H53.3z"/>
                    </g>
                    <g class="leaf4">
                        <path fill="#30C1A2" d="M15.404 73.424c5.426 8.162 14.184 13.734 23.584 15.918 9.4 2.188 19.738.756 28.818-2.558L54.392 59.458c-4.984-2.79-10.808-2.546-16.592-2.304-1.792.074-3.576.15-5.334.134C20.612 57.188 0 44.44 0 44.44s9.544 20.164 15.404 28.984"/>
                        <path fill="#29A389" d="M1.628 46.774c24.14 26.92 45.706 35.01 64.62 24.108a.5.5 0 1 0-.498-.868c-18.418 10.616-39.518 2.7-63.378-23.908a.5.5 0 1 0-.744.668z"/>
                    </g>
                    <g class="leaf5">
                        <path fill="#30C1A2" d="M123.048 57.288c-1.758.016-3.544-.06-5.334-.134-5.784-.242-11.61-.486-16.59 2.304L87.708 86.784c9.08 3.314 19.42 4.746 28.818 2.558 9.4-2.184 18.16-7.756 23.586-15.918 5.858-8.82 15.404-28.984 15.404-28.984s-20.612 12.748-32.468 12.848"/>
                        <path fill="#29A389" d="M154.372 46.774c-24.14 26.92-45.706 35.01-64.62 24.108a.5.5 0 1 1 .498-.868c18.418 10.616 39.518 2.7 63.378-23.908a.5.5 0 1 1 .744.668z"/>
                    </g>
                    <g class="leaf6">
                        <path fill="#30C1A2" d="M95.068 14.354c-2.854 4.038-6.23 7.52-8.824 11.81-2.596 4.29-4.18 6.018-3.268 11.394 0 0-.536 23.044 12.556 32.89 0 0 16.834-15.172 16.01-28.2C110.606 27.446 105.576 13.65 100.38 0c-.06 5.438-2.46 10.32-5.314 14.354"/>
                        <path fill="#29A389" d="M101.212 5.596c.634 35.66-9.484 55.664-30.412 59.826a.5.5 0 0 1-.196-.98c20.346-4.048 30.234-23.596 29.608-58.83a.5.5 0 0 1 1-.016z"/>
                    </g>
                    <g class="leaf7">
                        <path fill="#33CCAB" d="M70.948 10.236c-.382 4.56-1.056 8.216-2.812 12.396-2.826 6.73-7.722 12.406-10.794 19.028-4.808 10.362-4.732 22.87.2 33.172 2.194 4.586 5.37 8.798 9.614 11.592 4.246 2.798 13.008 2.892 13.294 2.868 5.126-.422 11.384-4.284 14.236-8.686 2.918-4.502 5.634-9.288 6.58-14.57 1.952-10.868-3.894-21.612-10.768-30.256-6.872-8.644-19.17-32.386-19.17-32.386s-.368 6.706-.38 6.842"/>
                        <path fill="#29A389" d="M71.8 8.396c10.202 37.51 12.008 63.414 5.464 77.66a.5.5 0 1 0 .908.418c6.672-14.524 4.854-40.62-5.408-78.34a.5.5 0 1 0-.966.262h.002z"/>
                    </g>
                </svg>
            </div>
            <!--    END Grow -->

            <div :class="['backgroundImage', processedContent.backgroundImage.position]" v-if="processedContent.backgroundImage && processedContent.backgroundImage">
                <flamelink-image v-bind:image="processedContent.backgroundImage"/>
            </div>
        </section>

        <section class="lowerActions" v-if="tapAnywhereEnabled || (isReflectScreen && response)">

            <!--    START Reflect -->
            <div v-if="isReflectScreen && response" class="reflect-container">
                <div class="duration">
                    <h5>{{formattedDuration}}</h5>
                </div>
                <div class="share-warning" v-if="isReflectScreen && response && response.shared">
                    <img src="/assets/images/users.svg"/>
                    <span class="shareText">This note is shared</span>
                </div>
                <transition name="fade-in" mode="out-in">
                    <div class="saved-container" v-show="showSaved || saving">
                        <span v-show="saving && !saved">{{promptCopy.SAVING}}...</span>
                        <span v-show="saved && !saving">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 13"><path d="M1.707 6.293A1 1 0 0 0 .293 7.707l5 5a1 1 0 0 0 1.414 0l11-11A1 1 0 1 0 16.293.293L6 10.586 1.707 6.293z"/></svg>
                            {{promptCopy.SAVED}}
                        </span>
                    </div>
                </transition>
                <div class="flexContainer">
                    <resizable-textarea v-bind:maxLines="4">
                    <textarea ref="reflectionInput"
                            type="text"
                            rows="1"
                            data-gramm="false"
                            v-model="response.content.text"
                            v-on:click.stop
                            :class="{hasValue: !!response.content.text}"
                            @focusin="disableNavigation"
                            @focusout="enableNavigation"
                    />
                    </resizable-textarea>
                    <span class="textareaPlaceholder">
                        <svg class="pen wiggle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path fill="#ffffff" d="M18.99.302a3.828 3.828 0 0 1 1.717 6.405l-13.5 13.5a1 1 0 0 1-.444.258l-5.5 1.5a1 1 0 0 1-1.228-1.228l1.5-5.5a1 1 0 0 1 .258-.444l13.5-13.5A3.828 3.828 0 0 1 18.99.302zM5.98 18.605L19.294 5.293a1.828 1.828 0 1 0-2.586-2.586L3.395 16.02l-.97 3.556 3.556-.97z"/></svg>
                        {{promptCopy.ADD_A_NOTE}}
                    </span>
                </div>
            </div>
            <!--    END Reflect-->
        </section>
        <PricingModal
                :showModal="showPricingModal"
                @close="showPricingModal = false"/>
        <element-description-modal
                :cactusElement="cactusModalElement"
                :showModal="cactusModalVisible"
                :navigationEnabled="true"
                :showIntroCard="false"
                @close="hideCactusModal"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {
        Content,
        ContentAction,
        ContentType,
        Image as ContentImage,
        LinkStyle,
        processContent
    } from "@shared/models/PromptContent"
    import ResizableTextarea from "@components/ResizableTextarea.vue";
    import Spinner from "@components/Spinner.vue";
    import FlamelinkImage from "@components/FlamelinkImage.vue";
    import ReflectionResponse from '@shared/models/ReflectionResponse'
    import { formatDurationAsTime } from '@shared/util/DateUtil'
    import { MINIMUM_REFLECT_DURATION_MS } from '@web/PromptContentUtil';
    import CopyService from '@shared/copy/CopyService'
    import { PromptCopy } from '@shared/copy/CopyTypes'
    // import VueSimpleMarkdown from 'vue-simple-markdown'
    import CopyTextInput from "@components/CopyTextInput.vue";
    import { QueryParam } from "@shared/util/queryParams"
    import SnackbarContent from "@components/SnackbarContent.vue"
    import ReflectionResponseService from '@web/services/ReflectionResponseService'
    import PromptContentCardElements from "@components/PromptContentCardElements.vue";
    import PromptContentCardInviteFriend from "@components/PromptContentCardInviteFriend.vue";
    import SharedReflectionCard from "@components/SharedReflectionCard.vue";
    import CactusMemberService from '@web/services/CactusMemberService'
    import { CactusElement } from "@shared/models/CactusElement";
    import CactusMember from "@shared/models/CactusMember";
    import ElementDescriptionModal from "@components/ElementDescriptionModal.vue";
    import SharingService from '@web/services/SharingService'
    import Logger from "@shared/Logger";
    import { gtag } from "@web/analytics";
    import MarkdownText from "@components/MarkdownText.vue"
    import { appendQueryParams, isBlank } from "@shared/util/StringUtil";
    import PricingModal from "@components/PricingModal.vue";

    const logger = new Logger("PromptContentCard.vue");
    const SAVED_INDICATOR_TIMEOUT_DURATION_MS = 2000;
    const copy = CopyService.getSharedInstance().copy;

    export default Vue.extend({
        components: {
            ResizableTextarea,
            Spinner,
            FlamelinkImage,
            CopyTextInput,
            SnackbarContent,
            SharedReflectionCard,
            PromptContentCardElements,
            PromptContentCardInviteFriend,
            ElementDescriptionModal,
            MarkdownText,
            PricingModal,
        },
        props: {
            content: {
                type: Object as () => Content
            },
            cactusElement: String,
            hasNext: Boolean,
            hasPrevious: Boolean,
            response: Object as () => ReflectionResponse,
            reflectionDuration: Number,
            saving: Boolean,
            saved: Boolean,
            tapAnywhereEnabled: Boolean
        },
        data(): {
            youtubeVideoLoading: boolean,
            editingResponse: string,
            showSaved: boolean,
            showSavingTimeout: any,
            promptCopy: PromptCopy,
            creatingLink: boolean,
            shareableLinkUrl: string | undefined,
            linkCreated: boolean,
            cactusModalVisible: boolean,
            cactusModalElement: string | undefined
            nativeShareEnabled: boolean,
            member: CactusMember | undefined,
            showPricingModal: boolean,
        } {
            return {
                youtubeVideoLoading: true,
                editingResponse: "",
                showSaved: false,
                showSavingTimeout: undefined,
                promptCopy: copy.prompts,
                creatingLink: false,
                shareableLinkUrl: undefined,
                linkCreated: false,
                cactusModalVisible: false,
                cactusModalElement: undefined,
                nativeShareEnabled: SharingService.canShareNatively(),
                member: undefined,
                showPricingModal: false,
            }
        },
        beforeMount() {
            this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(this.response);
            this.member = CactusMemberService.sharedInstance.currentMember;
        },
        watch: {
            saved(isSaved) {
                logger.log("saved changed", isSaved);
                if (this.showSavingTimeout) {
                    window.clearTimeout(this.showSavingTimeout);
                    this.showSavingTimeout = undefined;
                }
                if (isSaved) {
                    this.showSaved = true;
                }
                this.showSavingTimeout = setTimeout(() => {
                    this.showSaved = false;
                }, SAVED_INDICATOR_TIMEOUT_DURATION_MS);
            }
        },
        computed: {
            shareableLinkParams(): {} | undefined {
                if (this.shareableLinkUrl && this.member?.email) {
                    return {
                        [QueryParam.REFERRED_BY_EMAIL]: this.member.email,
                        [QueryParam.UTM_MEDIUM]: "prompt-share-note",
                        [QueryParam.UTM_SOURCE]: "cactus.app",
                    }
                }
                return;

            },
            showSkip(): boolean {
                return this.processedContent && this.processedContent.contentType === ContentType.share_reflection;
            },
            reflectionProgress(): number {
                return Math.min(this.reflectionDuration / MINIMUM_REFLECT_DURATION_MS, 1);
            },
            formattedDuration(): string {
                return formatDurationAsTime(this.reflectionDuration);
            },
            processedContent(): Content {
                return processContent(this.content);
            },
            quoteAvatar(): ContentImage | undefined | null {
                if (!this.content.quote || !this.content.quote.authorAvatar) {
                    return undefined;
                }

                return this.content.quote.authorAvatar;
            },
            isReflectScreen(): boolean {
                return this.content.contentType === ContentType.reflect
            },
            isShareNoteScreen(): boolean {
                return this.content.contentType === ContentType.share_reflection;
            },
            actionButtonClasses(): string {
                let classes = "";
                switch (this.processedContent?.actionButton?.linkStyle) {
                    case LinkStyle.buttonPrimary:
                        classes = "button primary";
                        break;
                    case LinkStyle.buttonSecondary:
                        classes = "button secondary";
                        break;
                    case LinkStyle.fancyLink:
                        classes = "link fancy";
                        break;
                    case LinkStyle.link:
                        classes = "link";
                        break;
                    default:
                        classes = "";
                        break;
                }
                return classes;
            },
            linkClasses(): string | undefined {
                if (!this.processedContent || !this.processedContent.link) {
                    return;
                }

                const linkStyle = this.processedContent.link.linkStyle || LinkStyle.link;
                let classes = "";
                switch (linkStyle) {
                    case LinkStyle.buttonPrimary:
                        classes = "button primary";
                        break;
                    case LinkStyle.buttonSecondary:
                        classes = "button secondary";
                        break;
                    case LinkStyle.fancyLink:
                        classes = "link fancy";
                        break;
                    case LinkStyle.link:
                        classes = "link";
                        break;
                }

                return classes;
            },
            linkDestinationUrl(): string | undefined {
                let linkUrl = this.content?.link?.destinationHref;

                if (linkUrl && this.content?.link?.appendMemberId && this.member?.id) {
                    linkUrl = appendQueryParams(this.content.link.destinationHref, { memberId: this.member.id });
                }

                return linkUrl;
            },
            showActionButton(): boolean {
                const button = this.processedContent?.actionButton;
                if (!button) {
                    return false
                }
                return button.action !== ContentAction.unknown && !isBlank(button.label)
            }
        },
        methods: {
            async shareNatively() {
                await SharingService.shareLinkNatively({
                    url: this.shareableLinkUrl,
                    title: "Read my private reflection on Cactus",
                    text: "I'm practicing mindful self-reflection with Cactus and shared this private note with you"
                })
            },
            async createSharableLink() {
                this.trackShareLink();
                this.creatingLink = true;
                let saved = await ReflectionResponseService.sharedInstance.shareResponse(this.response);
                this.shareableLinkUrl = ReflectionResponseService.getShareableUrl(saved);
                this.linkCreated = true;
                this.creatingLink = false;
            },
            async unshareReflection() {
                this.creatingLink = true;
                await ReflectionResponseService.sharedInstance.unShareResponse(this.response);
                this.shareableLinkUrl = undefined;
                this.creatingLink = false
            },

            async doButtonAction() {
                if (!this.content.actionButton) {
                    return;
                }
                const action = this.content.actionButton.action ?? ContentAction.unknown;
                switch (action) {
                    case ContentAction.showPricing:
                        this.showPricingModal = true;
                        break;
                    case ContentAction.next:
                        await this.next();
                        break;
                    case ContentAction.previous:
                        this.previous();
                        break;
                    case ContentAction.complete:
                        this.complete();
                        break;
                }

            },
            async next() {
                if (this.isReflectScreen && this.reflectionProgress < 1) {
                    return;
                }

                this.$emit("next")
            },
            previous() {
                this.$emit("previous");
            },
            complete() {
                this.$emit("complete")
            },
            enableNavigation() {
                this.$emit("navigationEnabled")
            },
            disableNavigation() {
                this.$emit("navigationDisabled")
            },
            showCactusModal(element: keyof typeof CactusElement) {
                this.cactusModalVisible = true;
                this.cactusModalElement = CactusElement[element];
                this.disableNavigation()
            },
            hideCactusModal() {
                this.cactusModalVisible = false;
                this.enableNavigation()
            },
            trackShareLink() {
                gtag('event', 'click', {
                    'event_category': "prompt_content",
                    'event_action': "shared_reflection"
                });
            }
        }
    })
</script>

<style lang="scss" scoped>
    @import "variables";
    @import "mixins";
    @import "forms";
    @import "common";
    @import "transitions";

    $cardPadding: 2.4rem;
    .content-card {
        background: $beige no-repeat;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 100vh;
        justify-content: center;
        padding: $cardPadding;
        width: 100%;

        &.type-reflect {
            padding-bottom: 0;

            .lowerActions {
                padding-bottom: $cardPadding;
            }
        }

        @include r(600) {
            border-radius: 12px;
            box-shadow: 0 11px 15px -7px rgba(0, 0, 0, .16),
            0 24px 38px 3px rgba(0, 0, 0, .1),
            0 9px 46px 8px rgba(0, 0, 0, .08);
            min-height: 100%;
            justify-content: space-between;
            position: relative;
        }

        &.type-share_reflection {
            background: transparent;
            box-shadow: none;
            color: $white;
            min-height: 0;
            padding-top: 4rem;

            .tight {
                opacity: .8;
            }

            .text {
                padding: 0 0 2.4rem;
            }
        }

        &.reflectScreen {
            justify-content: space-between;
        }

        &.bottom {
            overflow: hidden;

            .content {
                justify-content: flex-end;
            }
        }
    }

    .content, .lowerActions {
        background-color: $beige;
        z-index: 2;

        .type-share_reflection & {
            background-color: transparent;
        }
    }

    .backgroundImage {

        &:empty {
            display: none;
        }

        @include r(600) {
            display: flex;
            justify-content: center;
            max-height: none;
            order: 1;
            position: static;
        }

        &.top {
            margin-top: -2.4rem;
        }

        &.bottom {
            align-items: flex-end;
            margin: 0 -2.4rem -4rem;
        }

        img {
            max-height: 35rem;
            max-width: 100%;
            min-height: 30rem; /*for slow loading*/
        }
    }

    .element-container {
        cursor: pointer;
        text-align: center;
    }

    .text {
        display: flex;
        flex-direction: column;
        font-size: 2rem;
        justify-content: center;
        padding: 6.4rem 1.6rem 4rem;

        @include r(374) {
            font-size: 2.4rem;
        }
        @include r(600) {
            padding-top: 4rem;
        }

        p {
            white-space: pre-line;

            &.tight {
                font-size: 1.8rem;
            }
        }
    }

    .skip.tertiary {
        align-items: center;
        color: $darkestGreen;
        display: none;
        flex-grow: 0;
        justify-content: center;
        position: absolute;
        right: 0;
        top: 1.6rem;
        width: min-content;

        svg {
            height: 1.2rem;
            margin-left: .4rem;
            width: 1.2rem;
        }

        @include r(600) {
            display: none;
        }
    }

    .note {
        @include shadowbox;
        margin-bottom: 2.4rem;
        padding: 1.6rem 2.4rem;
        text-align: left;
    }

    .noteQuestion,
    .copyText {
        margin-bottom: .8rem;
    }

    .getLink {
        width: 100%;
    }

    .label {
        color: $darkestGreen;
        margin-bottom: 1.6rem;
    }

    .content {
        @include r(600) {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
        }
    }

    .element-icon {
        align-items: center;
        background-color: darken($beige, 5%);
        border-radius: 50%;
        display: inline-flex;
        height: 6.4rem;
        justify-content: center;
        margin-bottom: 1.6rem;
        padding: .4rem;
        width: 6.4rem;

        img {
            $avatarSize: 5.6rem;
            height: $avatarSize;
            width: $avatarSize;
        }
    }

    .quote-container {
        display: flex;
        flex-direction: column;

        .avatar-container {
            margin-bottom: 2.4rem;

            img {
                $avatarSize: 5.6rem;
                height: $avatarSize;
                width: $avatarSize;
            }
        }

        .quote {
            font-size: 2rem;
            margin-bottom: 2.4rem;
            padding: 0 1.6rem;

            @include r(374) {
                font-size: 2.4rem;
            }
        }

        .name {
            font-size: 1.6rem;
            opacity: .8;

            @include r(768) {
                font-size: 1.8rem;
            }
        }

        .title {
            opacity: .8;
        }
    }

    .photo-container {
        margin-top: 4rem;

        img {
            border-radius: 4px;
            display: block;
            max-width: 100%;
            margin: 0 auto; /* center smaller image in card */
        }
    }

    .video-container {
        border-radius: 4px;
        margin-top: 4rem;
        overflow: hidden;

        .iframe-wrapper {
            position: relative;
            padding-bottom: 56.25%; //makes a 16:9 aspect ratio
            padding-top: 2.4rem;

            .loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
            }
        }
    }

    .link-container {
        margin: -1.6rem 0 6.4rem;

        a {
            display: inline-block;
            margin: 0 auto;
            text-align: center;
        }
    }

    .audio-container {
        margin-top: 4rem;

        audio {
            border: 1px solid $lightGreen;
            box-shadow: rgba(7, 69, 76, 0.18) 0 11px 28px -8px;
            border-radius: 5.4rem;
            width: 100%;
        }
    }

    .grow-container {
        align-items: center;
        display: flex;
        // flex-basis: 50%;
        // flex-grow: 1;
        height: 156px;
        justify-content: center;
    }

    .leaf7 {
        animation: growingLeaves 8s forwards;
        transform: scale(0.3) translate(5px, 30px);
        transform-origin: center;
    }

    .leaf3, .leaf5, .leaf1, .leaf2, .leaf4, .leaf6 {
        animation: growingLeaves2 15s forwards;
        opacity: 0;
        transform: scale(0.5) translate(5px, 3px);
        transform-origin: center;
    }

    .leaf3 {
        animation-delay: 3s;
        animation-duration: 8s;
    }

    .leaf5 {
        animation-delay: 6s;
    }

    .leaf1 {
        animation-delay: 11s;
    }

    .leaf4 {
        animation-delay: 17s;
    }

    .leaf2 {
        animation-delay: 21s;
    }

    .leaf6 {
        animation-delay: 28s;
    }

    .stem1 {
        animation: growingLeaves 20s ease-out -3s forwards;
        transform: scale(0.3) translate(5px, 30px);
        transform-origin: bottom;
    }

    .stem2 {
        animation: growingLeaves2 16s ease-out 14s forwards;
        opacity: 0;
        transform: scale(0.5) translate(5px, 3px);
        transform-origin: bottom;
    }

    .stem3 {
        animation: growingLeaves2 16s ease-out 7s forwards;
        opacity: 0;
        transform: scale(0.5) translate(5px, 3px);
        transform-origin: bottom;
    }

    .grow5 {
        animation: grow 60s forwards;
        height: 75px;
        width: 78px;
    }

    .lowerActions {
        bottom: 0;
        left: 2.4rem;
        position: sticky;
        right: 2.4rem;

        @include r(600) {
            /*Removing absolute positioning to help with devices with a software keyboard (i.e. tablets) */
            /*position: absolute;*/
        }
    }

    .tap {
        font-size: 1.4rem;
        font-weight: bold;
        letter-spacing: 1px;
        opacity: .4;
        text-align: center;
        text-transform: uppercase;
    }

    .mobile-nav-buttons {
        background-color: $lightBlue;
        margin: 0 -2.4rem -3.2rem;
        padding: .8rem;

        @include r(600) {
            display: none;
        }
    }

    .saved-container {
        font-size: 1.6rem;
        margin-bottom: .8rem;
        opacity: .8;
        text-align: left;

        svg {
            fill: $darkGreen;
            height: 1.2rem;
            margin-right: .4rem;
            width: 1.6rem;
        }
    }

    .flexContainer {
        position: relative;
    }

    .reflect-container textarea {
        @include textArea;
        background-color: transparent;
        border-width: 0;
        border-radius: 2.4rem;
        cursor: pointer;
        max-height: 10rem;
        position: relative;
        transition: background-color .3s;
        width: 100%;
        z-index: 1;

        &:focus {
            background-color: $white;
        }

        &.hasValue {
            border-width: 1px;
            background-color: $white;
        }

        &:hover + .textareaPlaceholder .wiggle {
            animation: wiggle .5s forwards;
        }
    }

    .reflect-container textarea + .textareaPlaceholder {
        @include button;
        margin: 0 auto;
        align-items: center;
        bottom: 0;
        display: flex;
        justify-content: center;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        transition: opacity .3s;
        z-index: 0;

        .pen {
            height: 1.8rem;
            margin-right: .8rem;
            width: 1.8rem;
        }
    }

    .reflect-container textarea:focus + .textareaPlaceholder,
    .reflect-container textarea.hasValue + .textareaPlaceholder {
        opacity: 0;
    }

    .primaryBtn {
        width: 100%;

        @include r(600) {
            width: 50%;
        }
    }

    .duration {
        display: none;
    }

    .share-warning {
        align-items: center;
        display: flex;
        justify-content: center;
        padding: .8rem 1.6rem;

        img {
            height: 2rem;
            margin-right: .8rem;
            width: 2rem;
        }
    }

    .shareText {
        opacity: .7;
    }

    .directLink {
        margin-bottom: 1.6rem;
        opacity: .8;
    }

    .sharing {
        display: flex;
        justify-content: center;

        button {
            align-items: center;
            display: flex;
            flex-grow: 0;
            justify-content: center;
            margin-top: 1.6rem;
            width: auto;

            @include r(600) {
                width: 50%;
            }
        }

        .shareIcon {
            height: 1.6rem;
            margin-right: .8rem;
            width: 1.6rem;
        }
    }

    .snack {
        &-enter-active {
            transition: all .2s cubic-bezier(.42, .97, .52, 1.49)
        }

        &-leave-active {
            transition: all .2s ease;
        }

        &-enter {
            opacity: 0;
            transform: translateY(15px);
        }

        &-leave-to {
            opacity: 0;
            transform: translateX(-150px);
        }
    }

</style>
<style>
    @import "variables";

    .quote-container .md_wrapper strong {
        color: $indigo;
        font-size: 2.8rem;
        line-height: 1.2;
    }
</style>
