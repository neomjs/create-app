export default {
    init(appName, folder, fs, os, path) {
        const packageJson = {
            name: appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
                "add-config": "node ./node_modules/neo.mjs/buildScripts/addConfig.mjs",
                "build-all": "node ./node_modules/neo.mjs/buildScripts/buildAll.mjs -n",
                "build-all-questions": "node ./node_modules/neo.mjs/buildScripts/buildAll.mjs",
                "build-themes": "node ./node_modules/neo.mjs/buildScripts/buildThemes.mjs",
                "build-threads": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.mjs",
                "copy-examples": "node ./buildScripts/copyExamples.mjs",
                "create-app": "node ./node_modules/neo.mjs/buildScripts/createApp.mjs",
                "create-class": "node ./node_modules/neo.mjs/buildScripts/createClass.mjs",
                "create-component": "node ./node_modules/neo.mjs/buildScripts/createComponent.mjs",
                "generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.mjs",
                "inject-package-version": "node ./buildScripts/injectPackageVersion.mjs",
                "server-start": "webpack serve -c ./node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.mjs --open",
                "test": "echo \"Error: no test specified\" && exit 1",
                "watch-themes": "node ./node_modules/neo.mjs/buildScripts/watchThemes.mjs"
            },
            dependencies: {
                "neo.mjs": "^6.10.1"
            },
            devDependencies: {
                "@fortawesome/fontawesome-free": "^6.4.2",
                "autoprefixer": "^10.4.16",
                "chalk": "^5.3.0",
                "clean-webpack-plugin": "^4.0.0",
                "commander": "^11.1.0",
                "cssnano": "^6.0.1",
                "envinfo": "^7.11.0",
                "fs-extra": "^11.1.1",
                "highlightjs-line-numbers.js": "^2.8.0",
                "inquirer": "^9.2.12",
                "neo-jsdoc": "1.0.1",
                "neo-jsdoc-x": "1.0.5",
                "postcss": "^8.4.31",
                "sass": "^1.69.5",
                "siesta-lite": "5.5.2",
                "showdown": "^2.1.0",
                "url": "^0.11.3",
                "webpack": "^5.89.0",
                "webpack-cli": "^5.1.4",
                "webpack-dev-server": "4.15.1",
                "webpack-hook-plugin": "^1.0.7",
                "webpack-node-externals": "^3.0.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
