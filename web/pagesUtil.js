exports.getPages = function(config, allPages){
    const isDev = config.isDev || false;
    const pages = Object.keys(allPages).reduce((entries, title) => {
        const page = allPages[title]
        if (!isDev || page.includeInDev || !page.reflectionPrompt) {
            entries[title] = page
            console.log("Page Config: adding page", page.title);
        }
        return entries
    }, {})

    return pages;
}