'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
        const appsJson = {
            "bodyTag": "<body>",
            "environment": "development",
            "mainInput": "./node_modules/neo.mjs/src/Main.mjs",
            "mainOutput": "main.js",
            "workers": {
                "data": {
                    "input": "./node_modules/neo.mjs/src/worker/Data.mjs",
                    "output": "dataworker.js"
                },
                "vdom": {
                    "input": "./node_modules/neo.mjs/src/worker/VDom.mjs",
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

        if (appsJson.apps[appName]) {
            // todo: we could add an inquirer check to not override it
            console.log('Warning, an app with this name already exists. Overriding');
        }

        appsJson.apps[appName] = {
            "input": "myApps/"+appName+".mjs", // todo: create the entry point
            "output": "/apps/"+appName.toLowerCase()+"/",
            "title": appName
        };

        fs.writeFileSync(
            path.join(folder, 'myApps.json'),
            JSON.stringify(appsJson, null, 4) + os.EOL
        );
    }
};