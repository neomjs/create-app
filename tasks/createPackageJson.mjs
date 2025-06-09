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
                "neo.mjs": "^9.10.4"
            },
            devDependencies: {
                "@fortawesome/fontawesome-free": "^6.7.2",
                "autoprefixer"                 : "^10.4.21",
                "chalk"                        : "^5.4.1",
                "clean-webpack-plugin"         : "^4.0.0",
                "commander"                    : "^14.0.0",
                "cssnano"                      : "^7.0.7",
                "envinfo"                      : "^7.14.0",
                "fs-extra"                     : "^11.3.0",
                "highlightjs-line-numbers.js"  : "^2.9.0",
                "html-minifier-terser"         : "^7.2.0",
                "inquirer"                     : "^12.6.3",
                "marked"                       : "^15.0.12",
                "monaco-editor"                : "0.50.0",
                "neo-jsdoc"                    : "1.0.1",
                "neo-jsdoc-x"                  : "1.0.5",
                "postcss"                      : "^8.5.4",
                "sass"                         : "^1.89.1",
                "siesta-lite"                  : "5.5.2",
                "terser"                       : "^5.41.0",
                "url"                          : "^0.11.4",
                "webpack"                      : "^5.99.9",
                "webpack-cli"                  : "^6.0.1",
                "webpack-dev-server"           : "^5.2.2",
                "webpack-hook-plugin"          : "^1.0.7",
                "webpack-node-externals"       : "^3.0.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
