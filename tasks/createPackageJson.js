'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
        const packageJson = {
            name: appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            scripts: {
                "server-start": "webpack-dev-server --open",
                "build-all": "node ./node_modules/neo.mjs/buildScripts/buildAll.js -n",
                "build-all-questions": "node ./buildScripts/buildAll.js",
                "build-my-apps": "node ./node_modules/neo.mjs/buildScripts/webpack/buildMyApps.js",
                "build-themes": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThemes.js",
                "build-threads": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.js",
                "create-app": "node ./node_modules/neo.mjs/buildScripts/createApp.js",
                "generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.js",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            dependencies: {
                //"fibers": "^4.0.2",
                'neo.mjs': '^1.4.14',
                "sass": "^1.24.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};