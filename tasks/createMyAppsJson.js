'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
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
                        "indexPath": "node_modules/neo.mjs/docs/index.ejs",
                        "input": "docs/app.mjs",
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

        fs.writeFileSync(
            filePath,
            JSON.stringify(appsJson, null, 4) + os.EOL
        );
    }
};