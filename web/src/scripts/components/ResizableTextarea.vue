<script>
    export default {
        props: {
            maxHeightPx: {
                type: Number,
                default: 100,
            },
        },
        methods: {
            resizeTextarea(event) {


                // const currentHeight = event.target.scrollHeight
                // const lht = parseInt(event.target.lineHeight, 10)
                // // const lines =currentHeight / lht;
                // const maxHeight = lht * this.maxLines
                // console.log('line height', lht)
                // console.log('maxHeight ', maxHeight)
                // console.log('current height', currentHeight)
                // if (currentHeight < maxHeight) {
                //
                //     event.target.style.height = 'auto'
                //     const newHeight = Math.min(maxHeight, event.target.scrollHeight)
                //     event.target.style.height = (newHeight) + 'px'
                // }


                console.log('number of rows', event.target.rows)
                event.target.style.height = 'auto'
                const newHeight = event.target.scrollHeight + 2
                event.target.style.height = (Math.min(this.maxHeightPx, newHeight)) + 'px'

            },
        },
        mounted() {
            this.$nextTick(() => {
                this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight + 2) + 'px;overflow-y:auto;')
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