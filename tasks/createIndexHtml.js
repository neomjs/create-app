'use strict';

module.exports = {
    init: function (appName, folder, fs, mainThreadAddons, os, path, themes) {
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
            "            appPath         : '../../apps/" + appName.toLowerCase() + "/app.mjs',",
            "            basePath        : '../../',",
            "            environment     : 'development',",
            "            isExperimental  : true,",
        ];

        if (mainThreadAddons !== 'Stylesheet') {
            indexContent.push("            mainThreadAddons: [" + mainThreadAddons.map(e => "'" + e +"'").join(', ') + "],");
        }

        if (!themes.includes('all')) {
            let themeContent;

            if (!themes.includes('none')) {
                themeContent = "            themes          : [],";
            } else {
                themeContent = "            themes          : ['" + themes.join(', ') + "'],";
            }

            indexContent.push(themeContent);
        }

        indexContent.push(
            "            workerBasePath  : '../../node_modules/neo.mjs/src/worker/'",
            "        });",
            "    </script>",
            "",
            '    <script src="../../node_modules/neo.mjs/src/Main.mjs" type="module"></script>',
            "</body>",
            "</html>"
        )

        fs.writeFileSync(path.join(folder, 'index.html'), indexContent.join(os.EOL));
    }
};