<script>
    export default {
        props: {
            maxHeightPx: {
                type: Number,
                default: 100,
            },
            additionalOffsetPx: {
                type: Number,
                default: 2,
            }
        },
        methods: {
            resizeTextarea(event) {
                console.log('number of rows', event.target.rows)
                event.target.style.height = 'auto'
                const newHeight = event.target.scrollHeight + this.additionalOffsetPx //adding 2 to combat the weird scrolling when it is initially rendered
                event.target.style.height = (Math.min(this.maxHeightPx, newHeight)) + 'px'

            },
        },
        mounted() {
            this.$nextTick(() => {
                this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight + this.additionalOffsetPx) + 'px;overflow-y:auto;')
            })

            this.$el.addEventListener('input', this.resizeTextarea)
        },
        beforeDestroy() {
            this.$el.removeEventListener('input', this.resizeTextarea)
        },
        render() {
            return this.$slots.default[0]
        },
    }
</script>