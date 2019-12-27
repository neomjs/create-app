'use strict';

module.exports = {
    init: function (answers, appName, folder, fs, path, os) {
        const indexContent = [
            "<!DOCTYPE HTML>",
            "<html>",
            "<head>",
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <meta charset="UTF-8">',
            "    <title>" + appName + "</title>",
            "</head>",
            "<body>",
            "    <script>",
            "        Neo = self.Neo || {}; Neo.config = Neo.config || {};",
            "",
            "        Object.assign(Neo.config, {",
            "            appPath       : '../../app.mjs',",
            "            basePath      : './',",
            "            environment   : 'development',",
            "            isExperimental: true,",
            "            workerBasePath: './node_modules/neo.mjs/src/worker/'",
            "        });",
            "    </script>",
            "",
            '    <script src="./node_modules/neo.mjs/src/Main.mjs" type="module"></script>',
            "</body>",
            "</html>",
        ];

        if (answers['theme'] !== 'both') {
            console.log('add theme');
            indexContent[15] += ',';
            const themeContent = "            themes        : ['" + answers['theme'] + "']";
            indexContent.splice(16, 0, themeContent);
        }

        fs.writeFileSync(path.join(folder, 'index.html'), indexContent.join(os.EOL));
    }
};