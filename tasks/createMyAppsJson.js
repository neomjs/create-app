'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
        const filePath = path.join(folder, 'buildScripts/myApps.json');

        let appsJson;

        if (fs.existsSync(filePath)) {
            appsJson = JSON.parse(fs.readFileSync(filePath), 'utf8');

            if (appsJson.apps.includes(appName)) {
                // todo: we could add an inquirer check to not override it
                console.log('Warning, an app with this name already exists. Overriding');
            }
        } else {
            fs.mkdirSync(path.join(folder, 'buildScripts'));

            appsJson = {
                "mainInput": "./src/Main.mjs",
                "mainOutput": "main.js",
                "workers": {
                    "app": {
                        "input": "./src/worker/App.mjs",
                        "output": "appworker.js"
                    },
                    "data": {
                        "input": "./src/worker/Data.mjs",
                        "output": "dataworker.js"
                    },
                    "vdom": {
                        "input": "./src/worker/VDom.mjs",
                        "output": "vdomworker.js"
                    }
                },
                "apps": [
                    "Docs"
                ]
            };
        }

        appsJson.apps.push(appName);
        appsJson.apps.sort();

        fs.writeFileSync(
            filePath,
            JSON.stringify(appsJson, null, 4) + os.EOL
        );
    }
};
