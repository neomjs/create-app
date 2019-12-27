#!/usr/bin/env node

'use strict';

console.log('Create neo.mjs app');

const cp       = require('child_process'),
      fs       = require('fs'),
      inquirer = require('inquirer'),
      os       = require('os'),
      path     = require('path');

// npm binary based on OS
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';

let questions = [{
    type   : 'input',
    name   : 'appName',
    message: 'Please choose a name for your neo app:',
    default: 'MyApp'
}, {
    type   : 'list',
    name   : 'theme',
    message: 'Please choose a theme for your neo app:',
    choices: ['neo-theme-dark', 'neo-theme-light', 'both'],
    default: 'both'
}];

const handleExit = () => {
    console.log('Exiting without error.');
    process.exit();
};

const handleError = e => {
    console.error('ERROR! An error was encountered while executing');
    console.error(e);
    console.log('Exiting with error.');
    process.exit(1);
};

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

inquirer.prompt(questions).then(answers => {
    const appName  = answers['appName'],
          lAppName = appName.toLowerCase(),
          appPath  = 'apps/' + lAppName + '/',
          folder   = lAppName;

    fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) {
            throw err;
        }

        const appContent = [
            "import MainContainer from './view/MainContainer.mjs';",
            "",
            "Neo.onStart = function() {",
            "    Neo.app({",
            "        appPath : './',",
            "        mainView: MainContainer,",
            "        name    : '" + appName + "'",
            "    });",
            "};"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);

        const createIndexHtml = require('./createIndexHtml');
        createIndexHtml.init(answers, appName, folder, fs, path, os);

        const createMainContainer = require('./createMainContainer');
        createMainContainer.init(appName, folder, fs, path, os);

        const gitignoreContent = [
            "# See http://help.github.com/ignore-files/ for more about ignoring files.",
            "",
            "package-lock.json",
            "",
            "# dependencies",
            "/node_modules",
            "",
            "# IDEs and editors",
            "/.idea",
            ".project",
            ".classpath",
            "*.launch",
            ".settings",
            ".vscode/",
            "",
            "#System Files",
            ".DS_Store",
            "Thumbs.db"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, '.gitignore'), gitignoreContent);

        const packageJson = {
            name: appName.toLowerCase(),
            version: '0.1.0',
            private: true,
            scripts: {
                "server-start": "webpack-dev-server --open",
                "build-development": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.config.js",
                "build-production": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.config.js",
                "dev-css-structure": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=neo.structure.json",
                "dev-theme-dark": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.dark.json",
                "dev-theme-light": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.light.json",
                "prod-css-structure": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=neo.structure.json",
                "prod-theme-dark": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.dark.json",
                "prod-theme-light": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.light.json",
                "dev-theme-dark-no-css4": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.dark.noCss4.json",
                "dev-theme-light-no-css4": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.light.noCss4.json",
                "prod-theme-dark-no-css4": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.dark.noCss4.json",
                "prod-theme-light-no-css4": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.light.noCss4.json",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            dependencies: {
                //"fibers": "^4.0.2",
                'neo.mjs': '^1.0.17',
                "sass": "^1.24.0"
            }
        };

        fs.writeFileSync(
            path.join(folder, 'package.json'),
            JSON.stringify(packageJson, null, 4) + os.EOL
        );

        // npm install
        cp.spawnSync(npmCmd, ['i'], { env: process.env, cwd: folder, stdio: 'inherit' });

        /*fs.copyFileSync(path.resolve(__dirname, '/files/.gitignore'), folder + '/.gitignore', e => {
            if (e) {
                console.log(e);
            }
        });*/

        // Cleanup
        handleExit();
    });
});