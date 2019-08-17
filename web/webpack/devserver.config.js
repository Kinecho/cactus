const helpers = require('./../helpers')
const allPages = require('./../pages')
const pagesUtil = require('./../pagesUtil')
const util = require('util')
const fs = require('fs')
const path = require('path')
const writeFile = util.promisify(fs.writeFile)
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = function (config) {
    const pages = pagesUtil.getPages(config, allPages)
    const indexPath = path.join(helpers.srcDir, 'pages-index.html')

    const reflectionPagesHtml = Object.values(pages)
        .filter(page => page.path && page.reflectionPrompt)
        .sort((p1, p2) => p1.path.localeCompare(p2.path))
        .map(page => `<li class="message" style="padding:.5rem 0 .5rem 0;"><a style="text-decoration: none;" href="${page.path}"><strong>${page.path}</strong></a>&nbsp;<span style="color:#757575;">${page.name}.html</span></li>`)
        .join('\n')

    const pagesListHtml = Object.values(pages)
        .filter(page => page.path && !page.reflectionPrompt)
        .sort((p1, p2) => p1.path.localeCompare(p2.path))
        .map(page => `<li class="message" style="padding:.5rem 0 .5rem 0;"><a style="text-decoration: none;" href="${page.path}"><strong>${page.path}</strong></a>&nbsp;<span style="color:#757575;">${page.name}.html</span></li>`)
        .join('\n')
    writeFile(indexPath,
        `
<html><body>
<div class="centered">
<div>
<header style="text-align:center;margin-bottom: 2rem;">
    <img class="logo" src="/assets/images/logo.svg">
</header>
<h1>Dev Server Pages</h1>
</div>
<ul>${pagesListHtml}</ul>
<h2>Loaded Reflection Prompts</h2>
<ul>${reflectionPagesHtml}</ul>
</div>
</div></body></html>`)
    return {
        devServer: {
            open: false,
            contentBase: helpers.srcDir,
            stats: 'errors-warnings',
            hot: true,
            historyApiFallback: {
                disableDotRule: true,
                rewrites: [
                    {from: new RegExp('^/index$'), to: '/pages-index.html'},
                    ...Object.keys(pages).filter(page => {
                        return pages[page].path
                    }).map(filename => {
                        let page = pages[filename]
                        console.log('DevServer: adding page', page.path)

                        const suffix = page.indexPath ? '/(.+)' : '$'

                        let pattern = new RegExp('^' + page.path + suffix)
                        return {from: pattern, to: `/${filename}.html`}
                    }),
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
        })],
    }
}