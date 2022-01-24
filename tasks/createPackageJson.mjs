export default {
    init(appName, folder, fs, os, path) {
        const packageJson = {
            name: appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
                "build-all": "node ./node_modules/neo.mjs/buildScripts/buildAll.mjs -n",
                "build-all-questions": "node ./buildScripts/buildAll.mjs",
                "build-my-apps": "node ./node_modules/neo.mjs/buildScripts/webpack/buildMyApps.mjs",
                "build-themes": "node ./node_modules/neo.mjs/buildScripts/buildThemes.mjs",
                "build-threads": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.mjs",
                "copy-examples": "node ./buildScripts/copyExamples.mjs",
                "create-app": "node ./node_modules/neo.mjs/buildScripts/createApp.mjs",
                "generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.mjs",
                "server-start": "webpack serve -c ./node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.mjs --open",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            dependencies: {
                "fs-extra": "^10.0.0",
                "neo.mjs": "^3.1.1"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
