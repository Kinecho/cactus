<template>
    <div class="centered">
        <div class="footerInfo">
            <img class="logomark" src="/assets/images/logoMark.svg" alt="" />
            <div class="footerContent">
                <p class="copyright">&copy; 2019 Cactus. All rights reserved.<br>
                    Have questions?&nbsp;&nbsp;<a class="contact" href="mailto:help@cactus.app">Send an email.</a><br>
                    <a class="legal" href="/privacy-policy">Privacy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a class="legal" href="/terms-of-service">Terms</a>
                </p>
                <nav class="socialLinks">
                    <a class="link" href="https://www.facebook.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/facebook.svg" alt="facebook" /></a>
                    <a class="link" href="https://twitter.com/itscalledcactus" target="_blank"><img class="icon" src="/assets/images/twitter.svg" alt="twitter" /></a>
                    <a class="link" href="https://www.linkedin.com/company/19185975" target="_blank"><img class="icon" src="/assets/images/linkedin.svg" alt="linkedin" /></a>
                    <a class="link" href="https://www.instagram.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/instagram.svg" alt="instagram" /></a>
                    <a class="link" href="https://www.pinterest.com/itscalledcactus/" target="_blank"><img class="icon" src="/assets/images/pinterest.svg" alt="pinterest" /></a>
                    <a class="link" href="https://itscalledcactus.tumblr.com/" target="_blank"><img class="icon" src="/assets/images/tumblr.svg" alt="tumblr" /></a>
                </nav>
            </div>
        </div>
        <AppStoreIcon />
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import AppStoreIcon from "@web/components/AppStoreIcon.vue";

    export default Vue.extend({
        components: {
            AppStoreIcon
        }
    })

</script>
