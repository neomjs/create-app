import {AGENT_SKILLS_RANGE, agentScripts} from './createAgentLayer.mjs';

/**
 * @summary The devDependencies a default first run imports. A workspace installs these and the engine; every other
 * name of the list below is a build tool, which waits in `package.json` under `neo.buildTools`.
 *
 * The two bundles `postinstall` builds need `esbuild`, `parse5` and `marked`. The development theme build
 * (`themes.mjs`) imports `autoprefixer`, `chalk`, `commander`, `cssnano`, `envinfo`, `fs-extra`, `inquirer` and
 * `postcss`. The engine's file server imports `commander`, and dev mode loads the icon font from `node_modules`.
 * `scripts/check-engine-parity.mjs` fails when a name here is missing from the list.
 * @member {Set<String>}
 */
export const FIRST_RUN = new Set([
    '@fortawesome/fontawesome-free', 'autoprefixer', 'chalk', 'commander', 'cssnano', 'envinfo', 'esbuild', 'fs-extra',
    'inquirer', 'marked', 'parse5', 'postcss'
]);

/**
 * @summary The command that installs the build tools once (`resources/addBuildTools.mjs`, copied into the workspace).
 * @member {String}
 */
export const ADD_BUILD_TOOLS = 'node ./buildScripts/addBuildTools.mjs';

/**
 * @summary The generated scripts that import or spawn a build tool. Each runs {@link ADD_BUILD_TOOLS} first, so it
 * works in a fresh workspace with no command before it.
 * @member {String[]}
 */
export const NEEDS_BUILD_TOOLS = [
    'build-all', 'build-all-questions', 'build-dist-esm', 'build-highlightjs', 'build-threads', 'bundle-mermaid',
    'bundle-monaco', 'create-theme', 'generate-docs-json'
];

export default {
    /**
     * @param {String}  appName
     * @param {String}  folder
     * @param {Object}  fs
     * @param {Object}  os
     * @param {Object}  path
     * @param {Boolean} [agent=true] Add the coding-agent layer: the `app` skills, materialized by the workspace's own install
     */
    init(appName, folder, fs, os, path, agent = true) {
        const packageJson = {
            name   : appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            type   : 'module',
            scripts: {
                "add-build-tools"    : ADD_BUILD_TOOLS,
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
                "create-theme"       : "node ./node_modules/neo.mjs/buildScripts/create/theme.mjs",
                "generate-docs-json" : "node ./node_modules/neo.mjs/buildScripts/docs/generateDocsJson.mjs",
                // The engine package ships no generated bundles, and an install replaces node_modules/neo.mjs, so every
                // install rebuilds the two the engine imports at module scope. The others load lazily: bundle-browser-deps.
                // It installs nothing inside the engine: the engine's build scripts resolve the workspace's packages.
                "postinstall"        : "npm run bundle-parse5 && npm run bundle-marked",
                // The app it opens lives in that script as data (createServerScript.mjs), never in this shell line
                "server-start"       : "node ./buildScripts/server.mjs",
                "watch-themes"       : "node ./node_modules/neo.mjs/buildScripts/helpers/watchThemes.mjs"
            },
            dependencies: {
                "neo.mjs": "^14.0.0"
            },
            devDependencies: {
                "@fortawesome/fontawesome-free": "^7.3.1",
                "@playwright/test"             : "^1.63.0",
                "acorn"                        : "^8.19.0",
                "astring"                      : "^1.9.0",
                "autoprefixer"                 : "^10.6.1",
                "chalk"                        : "^6.0.1",
                "commander"                    : "^15.0.0",
                "cssnano"                      : "^9.3.2",
                "envinfo"                      : "^7.21.0",
                "esbuild"                      : "^0.28.2",
                "fast-glob"                    : "^3.3.3",
                "fs-extra"                     : "^11.4.1",
                "gray-matter"                  : "^4.0.3",
                "highlight.js"                 : "^11.12.0",
                "highlightjs-line-numbers.js"  : "^2.9.1",
                "html-minifier-terser"         : "^7.2.0",
                "inquirer"                     : "^14.2.3",
                "jsdoc-api"                    : "^9.3.6",
                "js-yaml"                      : "^5.4.3",
                "marked"                       : "^18.1.0",
                "mermaid"                      : "^12.1.0",
                "monaco-editor"                : "0.57.0",
                "parse5"                       : "^8.0.1",
                "postcss"                      : "^8.5.29",
                "postcss-selector-parser"      : "^7.1.7",
                "semver"                       : "^7.8.5",
                "terser"                       : "^5.51.2",
                "url"                          : "^0.11.4",
                "webpack"                      : "^5.111.1",
                "webpack-cli"                  : "^7.2.3",
                "webpack-hook-plugin"          : "^1.0.7",
                "ws"                           : "^8.22.0"
            },
            // npm reads overrides only in the root project, so the engine's floors reach the app's own install
            // through this copy alone. check-engine-parity.mjs keeps it equal to the pinned release's.
            overrides: {
                "dompurify"  : "^3.4.17",
                "gray-matter": {"js-yaml": "^3.15.2"},
                "katex"      : "^0.18.2",
                "lodash-es"  : "^4.18.0"
            }
        };

        // A workspace installs what its first run runs. The build tools stand as a recipe, and addBuildTools.mjs
        // installs them and declares them in devDependencies.
        const split = firstRun => Object.fromEntries(
            Object.entries(packageJson.devDependencies).filter(([name]) => FIRST_RUN.has(name) === firstRun)
        );

        packageJson.neo             = {buildTools: split(false)};
        packageJson.devDependencies = split(true);

        for (const name of NEEDS_BUILD_TOOLS) {
            packageJson.scripts[name] = `${ADD_BUILD_TOOLS} && ${packageJson.scripts[name]}`
        }

        if (agent) {
            Object.assign(packageJson.scripts, agentScripts);
            packageJson.devDependencies['neo-agent-skills'] = AGENT_SKILLS_RANGE;

            // Both blocks are written alphabetically; an added key keeps that order.
            packageJson.scripts         = Object.fromEntries(Object.entries(packageJson.scripts).sort(([a], [b]) => a.localeCompare(b)));
            packageJson.devDependencies = Object.fromEntries(Object.entries(packageJson.devDependencies).sort(([a], [b]) => a.localeCompare(b)))
        }

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );
    }
};
