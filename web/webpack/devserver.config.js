const helpers = require('./../helpers')
const allPages = require('./../pages')
const pagesUtil = require("./../pagesUtil");
module.exports = function (config) {
    const pages = pagesUtil.getPages(config, allPages);
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
                        console.log('DevServer: adding page', filename)
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