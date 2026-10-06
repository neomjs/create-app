export default {
    init(appName, folder, fs, os, path) {
        const packageJson = {
            name   : appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            type   : 'module',
            scripts: {
                "add-config"         : "node ./node_modules/neo.mjs/buildScripts/create/addConfig.mjs",
                "add-reactive-tags"  : "node ./node_modules/neo.mjs/buildScripts/helpers/addReactiveTags.mjs",
                "build-all"          : "node ./node_modules/neo.mjs/buildScripts/build/all.mjs -n",
                "build-all-questions": "node ./node_modules/neo.mjs/buildScripts/build/all.mjs",
                "build-dist-esm"     : "node ./node_modules/neo.mjs/buildScripts/build/esmodules.mjs",
                "build-highlightjs"  : "node ./node_modules/neo.mjs/buildScripts/build/highlightJs.mjs",
                "build-themes"       : "node ./node_modules/neo.mjs/buildScripts/build/themes.mjs",
                "build-threads"      : "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.mjs",
                "bundle-browser-deps": "npm run bundle-parse5 && npm run bundle-marked && npm run bundle-mermaid && npm run bundle-monaco && npm run build-highlightjs",
                "bundle-marked"      : "node ./node_modules/neo.mjs/buildScripts/build/marked.mjs",
                "bundle-mermaid"     : "node ./node_modules/neo.mjs/buildScripts/build/mermaid.mjs",
                "bundle-monaco"      : "node ./node_modules/neo.mjs/buildScripts/build/monaco.mjs",
                "bundle-parse5"      : "node ./node_modules/neo.mjs/buildScripts/build/parse5.mjs",
                "check-reactive-tags": "node ./node_modules/neo.mjs/buildScripts/helpers/checkReactiveTags.mjs",
                "copy-examples"      : "node ./buildScripts/copyExamples.mjs",
                "create-app"         : "node ./node_modules/neo.mjs/buildScripts/create/app.mjs",
                "create-app-minimal" : "node ./node_modules/neo.mjs/buildScripts/create/appMinimal.mjs",
                "create-class"       : "node ./node_modules/neo.mjs/buildScripts/create/class.mjs",
                "create-component"   : "node ./node_modules/neo.mjs/buildScripts/create/component.mjs",
                "generate-docs-json" : "node ./node_modules/neo.mjs/buildScripts/docs/generateDocsJson.mjs",
                // The engine package ships no generated bundles, and an install replaces node_modules/neo.mjs, so every
                // install rebuilds the two the engine imports at module scope. The others load lazily: bundle-browser-deps.
                "postinstall"        : "cd node_modules/neo.mjs && npm i && npm run bundle-parse5 && npm run bundle-marked",
                "server-start"       : "webpack serve -c ./node_modules/neo.mjs/buildScripts/webpack/webpack.server.config.mjs --open",
                "test"               : "playwright test -c node_modules/neo.mjs/test/playwright/playwright.config.mjs",
                "test-components"    : "playwright test -c node_modules/neo.mjs/test/playwright/playwright.config.component.mjs",
                "test-e2e"           : "playwright test -c node_modules/neo.mjs/test/playwright/playwright.config.e2e.mjs",
                "test-unit"          : "playwright test -c node_modules/neo.mjs/test/playwright/playwright.config.unit.mjs",
                "watch-themes"       : "node ./node_modules/neo.mjs/buildScripts/helpers/watchThemes.mjs"
            },
            dependencies: {
                "neo.mjs": "^13.2.0"
            },
            devDependencies: {
                "@fortawesome/fontawesome-free": "^7.3.1",
                "@playwright/test"             : "^1.63.0",
                "acorn"                        : "^8.17.0",
                "astring"                      : "^1.9.0",
                "autoprefixer"                 : "^10.6.1",
                "chalk"                        : "^6.0.1",
                "commander"                    : "^15.0.0",
                "cssnano"                      : "^9.2.0",
                "envinfo"                      : "^7.21.0",
                "esbuild"                      : "^0.28.2",
                "fast-glob"                    : "^3.3.3",
                "fs-extra"                     : "^11.4.1",
                "gray-matter"                  : "^4.0.3",
                "highlightjs-line-numbers.js"  : "^2.9.1",
                "html-minifier-terser"         : "^7.2.0",
                "inquirer"                     : "^14.2.2",
                "jsdoc-api"                    : "^9.3.6",
                "js-yaml"                      : "^5.4.2",
                "marked"                       : "^18.0.14",
                "mermaid"                      : "^12.1.0",
                "monaco-editor"                : "0.57.0",
                "parse5"                       : "^8.0.1",
                "postcss"                      : "^8.5.28",
                "sass"                         : "^1.105.1",
                "semver"                       : "^7.8.5",
                "terser"                       : "^5.51.2",
                "url"                          : "^0.11.4",
                "webpack"                      : "^5.111.1",
                "webpack-cli"                  : "^7.2.3",
                "webpack-dev-server"           : "^6.0.0",
                "webpack-hook-plugin"          : "^1.0.7",
                "ws"                           : "^8.22.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
