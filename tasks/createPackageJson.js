'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
        const packageJson = {
            name: appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            scripts: {
                "build-all": "node ./node_modules/neo.mjs/buildScripts/buildAll.js -n",
                "build-all-questions": "node ./buildScripts/buildAll.js",
                "build-my-apps": "node ./node_modules/neo.mjs/buildScripts/webpack/buildMyApps.js",
                "build-themes": "node ./node_modules/neo.mjs/buildScripts/buildThemes.js",
                "build-threads": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.js",
                "create-app": "node ./node_modules/neo.mjs/buildScripts/createApp.js",
                "generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.js",
                "server-start": "webpack serve -c ./node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.js --open",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            dependencies: {
                "neo.mjs": "^2.0.33"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
