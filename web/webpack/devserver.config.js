const helpers = require('./../helpers')
const pages = require('./../pages')

module.exports = function (config) {
    return {
        devServer: {
            open: false,
            contentBase: helpers.srcDir,
            stats: "errors-warnings",
            historyApiFallback: {
                disableDotRule: true,
                rewrites: [
                    ...Object.keys(pages).filter(page => {
                        return pages[page].path
                    }).map(filename => {
                        console.log('adding page', filename)
                        let page = pages[filename]
                        let pattern = new RegExp('^' + page.path + '$')
                        return {from: pattern, to: `/${filename}.html`}
                    }),
                    {from: /./, to: '/404.html'},
                ],
            },
        },
    }
}