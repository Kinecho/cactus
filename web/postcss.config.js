const autoprefixer = require("autoprefixer");

module.exports = {
    plugins: [
        autoprefixer({
            grid: "autoplace",
            // browsers: [
            //     "> 1%",
            //     "last 4 versions"
            // ]
        }),
    ],

}