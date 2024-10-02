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
                "create-app-minimal": "node ./node_modules/neo.mjs/buildScripts/createAppMinimal.mjs",
                "create-class": "node ./node_modules/neo.mjs/buildScripts/createClass.mjs",
                "create-component": "node ./node_modules/neo.mjs/buildScripts/createComponent.mjs",
                "generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.mjs",
                "inject-package-version": "node ./buildScripts/injectPackageVersion.mjs",
                "server-start": "webpack serve -c ./buildScripts/webpack/webpack.server.config.mjs --open",
                "test": "echo \"Error: no test specified\" && exit 1",
                "watch-themes": "node ./node_modules/neo.mjs/buildScripts/watchThemes.mjs"
            },
            dependencies: {
                "neo.mjs": "^7.13.0"
            },
            devDependencies: {
                "@fortawesome/fontawesome-free": "^6.6.0",
                "autoprefixer": "^10.4.20",
                "chalk": "^5.3.0",
                "clean-webpack-plugin": "^4.0.0",
                "commander": "^12.1.0",
                "cssnano": "^7.0.5",
                "envinfo": "^7.13.0",
                "fs-extra": "^11.2.0",
                "highlightjs-line-numbers.js": "^2.8.0",
                "inquirer": "^10.1.8",
                "marked": "^14.0.0",
                "monaco-editor": "0.50.0",
                "neo-jsdoc": "1.0.1",
                "neo-jsdoc-x": "1.0.5",
                "postcss": "^8.4.41",
                "sass": "^1.77.8",
                "siesta-lite": "5.5.2",
                "url": "^0.11.4",
                "webpack": "^5.93.0",
                "webpack-cli": "^5.1.4",
                "webpack-dev-server": "^5.0.4",
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
