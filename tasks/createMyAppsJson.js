'use strict';

module.exports = {
    init: function (appName, folder, fs, mainThreadAddons, os, path, themes, useSharedWorkers) {
        const filePath = path.join(folder, 'buildScripts/myApps.json');
        let appsJson;

        if (fs.existsSync(filePath)) {
            appsJson = JSON.parse(fs.readFileSync(filePath), 'utf8');

            if (appsJson.apps[appName]) {
                // todo: we could add an inquirer check to not override it
                console.log('Warning, an app with this name already exists. Overriding');
            }
        } else {
            appsJson = {
                "bodyTag": "<body>",
                "mainInput": "./src/Main.mjs",
                "mainOutput": "main.js",
                "workers": {
                    "data": {
                        "input": "./src/worker/Data.mjs",
                        "output": "dataworker.js"
                    },
                    "vdom": {
                        "input": "./src/worker/VDom.mjs",
                        "output": "vdomworker.js"
                    }
                },
                "apps": {
                    "Docs": {
                        "input": "buildScripts/entrypoints/Docs.mjs",
                        "mainThreadAddons": "'HighlightJS', 'Stylesheet'",
                        "output": "/docs/",
                        "title" : "Neo Docs"
                    }
                }
            };
        }

        appsJson.apps[appName] = {
            "input": "buildScripts/entrypoints/"+appName+".mjs",
            "output": "/apps/"+appName.toLowerCase()+"/",
            "title": appName
        };

        if (!(mainThreadAddons.includes('Stylesheet') && mainThreadAddons.length === 1)) {
            appsJson.apps[appName].mainThreadAddons = mainThreadAddons.map(e => "'" + e + "'").join(', ');
        }

        if (!themes.includes('all')) {
            if (themes.includes('none')) {
                appsJson.apps[appName].themes = [];
            } else {
                appsJson.apps[appName].themes = themes.map(e => "'" + e + "'").join(', ');
            }
        }

        if (useSharedWorkers !== 'no') {
            appJson.apps[appName].useSharedWorkers = true;
        }

        fs.writeFileSync(
            filePath,
            JSON.stringify(appsJson, null, 4) + os.EOL
        );
    }
};