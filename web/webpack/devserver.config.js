const helpers = require('./../helpers')
const pages = require('./../pages')
const util = require('util')
const fs = require('fs')
const path = require('path')
const writeFile = util.promisify(fs.writeFile)
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HTMLWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')

module.exports = function (config) {
    pages.login = {
        'title': 'Log In',
        'path': '/login',
        'name': 'sign_up',
    }

    const indexPath = path.join(helpers.srcDir, 'pages-index.html')
    createDevIndexPage(indexPath)
    return {
        devServer: {
            open: false,
            contentBase: helpers.srcDir,
            stats: 'errors-warnings',
            hot: true,
            https: config.https || false,
            historyApiFallback: {
                disableDotRule: true,
                rewrites: [
                    {from: new RegExp('^/index$'), to: '/pages-index.html'},
                    ...createPageRewrites(),
                    {from: /./, to: '/404.html'},
                ],
            },
        },

        plugins: [new HtmlWebpackPlugin({
            chunks: ['common', 'pages-index'],
            title: 'Page Index',
            template: indexPath,
            filename: `pages-index.html`,
            favicon: `${helpers.srcDir}/favicon.ico`,
            alwaysWriteToDisk: true,
        }), new HTMLWebpackHarddiskPlugin({
            outputPath: helpers.publicDir,
        })],
    }
}

function createPageRewrites() {
    return Object.keys(pages).filter( filename => {
        //ensure the page has a path. 404 will get filtered out
        let page = pages[filename]
        return page.path
    }).map(filename => {
        let page = pages[filename]
        console.log('DevServer: adding page', page.path)

        const suffix = page.indexPath ? '/(.+)' : '$'

        let pattern = new RegExp('^' + page.path + suffix)
        return {from: pattern, to: `/${page.name}.html`}
    })
}

function createDevIndexPage(indexPath) {
    const pagesListHtml = Object.values(pages)
        .filter(page => page.path)
        .sort((p1, p2) => p1.path.localeCompare(p2.path))
        .map(page => `<li class="message" style="padding:.5rem 0 .5rem 0;"><a style="text-decoration: none;" href="${page.path}"><strong>${page.path}</strong></a>&nbsp;<span style="color:#757575;">${page.name}.html</span></li>`)
        .join('\n')
    writeFile(indexPath,
        `
<html>
<body>
    <div class="centered">
        <div>
            <header style="text-align:center;margin-bottom: 2rem;">
                <img class="logo" src="/assets/images/logo.svg" alt="logo"/>
            </header>
            <h1>Dev Server Pages</h1>
        </div>
        <ul>${pagesListHtml}</ul>
    </div>
</body>
</html>`)
}