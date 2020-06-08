<script>
    import Logger from '@shared/Logger'

    const logger = new Logger('ResizableTextarea')

    export default {
        props: {
            maxHeightPx: {
                type: Number,
                default: 100,
            },
            additionalOffsetPx: {
                type: Number,
                default: 2,
            },
        },
        watch: {
            maxHeightPx() {
                this.resizeTextarea()
            },
        },
        methods: {
            resizeTextarea() {
                let textarea = this.$el
                textarea.style.height = 'auto'
                const newHeight = textarea.scrollHeight + this.additionalOffsetPx //adding 2 to combat the weird scrolling when it is initially rendered
                textarea.style.height = (Math.min(this.maxHeightPx, newHeight)) + 'px'
                logger.info('Set text area height to ', textarea.style.height)
            },
        },
        mounted() {
            // this.$nextTick(() => {
            //     this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight + this.additionalOffsetPx) + 'px;overflow-y:auto;')
            // })

            this.$el.addEventListener('input', this.resizeTextarea)
            this.resizeTextarea()
            window.setTimeout(() => {
                this.resizeTextarea()
            }, 10)
        },
        beforeDestroy() {
            this.$el.removeEventListener('input', this.resizeTextarea)
        },
        render() {
            return this.$slots.default[0]
        },
    }
</script>