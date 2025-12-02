export default {
    init(appName, folder, fs, os, path) {
        const packageJson = {
            name   : appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            type   : 'module',
            scripts: {
                "add-config"            : "node ./node_modules/neo.mjs/buildScripts/addConfig.mjs",
                "ai:build-kb"           : "npm run ai:create-kb && npm run ai:embed-kb",
                "ai:create-kb"          : "node ./node_modules/neo.mjs/buildScripts/ai/createKnowledgeBase.mjs",
                "ai:embed-kb"           : "node ./node_modules/neo.mjs/buildScripts/ai/embedKnowledgeBase.mjs",
                "ai:query"              : "node ./node_modules/neo.mjs/buildScripts/ai/queryKnowledgeBase.mjs",
                "ai:server"             : "chroma run --path ./chroma",
                "build-all"             : "node ./node_modules/neo.mjs/buildScripts/buildAll.mjs -n",
                "build-all-questions"   : "node ./node_modules/neo.mjs/buildScripts/buildAll.mjs",
                "build-es-modules"      : "node ./node_modules/neo.mjs/buildScripts/buildESModules.mjs",
                "build-themes"          : "node ./node_modules/neo.mjs/buildScripts/buildThemes.mjs",
                "build-threads"         : "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.mjs",
                "bundle-parse5"         : "node ./node_modules/neo.mjs/buildScripts/bundleParse5.mjs",
                "copy-examples"         : "node ./buildScripts/copyExamples.mjs",
                "create-app"            : "node ./node_modules/neo.mjs/buildScripts/createApp.mjs",
                "create-app-minimal"    : "node ./node_modules/neo.mjs/buildScripts/createAppMinimal.mjs",
                "create-class"          : "node ./node_modules/neo.mjs/buildScripts/createClass.mjs",
                "create-component"      : "node ./node_modules/neo.mjs/buildScripts/createComponent.mjs",
                "generate-docs-json"    : "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.mjs",
                "inject-package-version": "node ./node_modules/neo.mjs/buildScripts/injectPackageVersion.mjs",
                "server-start"          : "webpack serve -c ./buildScripts/webpack/webpack.server.config.mjs --open",
                "test"                  : "echo \"Error: no test specified\" && exit 1",
                "watch-themes"          : "node ./node_modules/neo.mjs/buildScripts/watchThemes.mjs"
            },
            dependencies: {
                "neo.mjs": "^11.14.0"
            },
            devDependencies: {
                "@chroma-core/default-embed"   : "^0.1.9",
                "@fortawesome/fontawesome-free": "^7.1.0",
                "@google/generative-ai"        : "^0.24.1",
                "@modelcontextprotocol/sdk"    : "^1.23.0",
                "@playwright/test"             : "^1.57.0",
                "acorn"                        : "^8.15.0",
                "astring"                      : "^1.9.0",
                "autoprefixer"                 : "^10.4.22",
                "chalk"                        : "^5.6.2",
                "chromadb"                     : "^3.1.6",
                "clean-webpack-plugin"         : "^4.0.0",
                "commander"                    : "^14.0.2",
                "cssnano"                      : "^7.1.2",
                "dotenv"                       : "^17.2.3",
                "envinfo"                      : "^7.21.0",
                "esbuild"                      : "^0.27.0",
                "fast-glob"                    : "^3.3.3",
                "fs-extra"                     : "^11.3.2",
                "glob"                         : "^13.0.0",
                "gray-matter"                  : "^4.0.3",
                "highlightjs-line-numbers.js"  : "^2.9.1",
                "html-minifier-terser"         : "^7.2.0",
                "inquirer"                     : "^13.0.1",
                "jsdoc-api"                    : "^9.3.5",
                "js-yaml"                      : "^4.1.1",
                "marked"                       : "^17.0.1",
                "monaco-editor"                : "0.50.0",
                "parse5"                       : "^8.0.0",
                "postcss"                      : "^8.5.6",
                "sass"                         : "^1.94.2",
                "semver"                       : "^7.7.3",
                "terser"                       : "^5.44.1",
                "url"                          : "^0.11.4",
                "webpack"                      : "^5.103.0",
                "webpack-cli"                  : "^6.0.1",
                "webpack-dev-server"           : "^5.2.2",
                "webpack-hook-plugin"          : "^1.0.7",
                "webpack-node-externals"       : "^3.0.0",
                "yargs"                        : "^18.0.0",
                "zod"                          : "^3.25.76",
                "zod-to-json-schema"           : "^3.25.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
