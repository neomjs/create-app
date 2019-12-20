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
            "        appPath : '" + appPath + "',",
            "        mainView: MainContainer,",
            "        name    : '" + appName + "'",
            "    });",
            "};"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);

        const indexContent = [
            "<!DOCTYPE HTML>",
            "<html>",
            "<head>",
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <meta charset="UTF-8">',
            "    <title>" + appName + "</title>",
            "</head>",
            "<body>",
            "    <script>",
            "        Neo = self.Neo || {}; Neo.config = Neo.config || {};",
            "",
            "        Object.assign(Neo.config, {",
            "            appPath       : '" + appPath + "app.mjs',",
            "            basePath      : '../../',",
            "            environment   : 'development',",
            "            isExperimental: true",
            "        });",
            "    </script>",
            "",
            '    <script src="./node_modules/neo.mjs/src/Main.mjs" type="module"></script>',
            "</body>",
            "</html>",
        ];

        if (answers['theme'] !== 'both') {
            console.log('add theme');
            indexContent[15] += ',';
            const themeContent = "            themes        : ['" + answers['theme'] + "']";
            indexContent.splice(16, 0, themeContent);
        }

        fs.writeFileSync(path.join(folder, 'index.html'), indexContent.join(os.EOL));

        const mainContainerContent = [
            "import {default as Component}    from '../node_modules/neo.mjs/src/component/Base.mjs';",
            "import {default as TabContainer} from '../node_modules/neo.mjs/src/tab/Container.mjs';",
            "import Viewport                  from '../node_modules/neo.mjs/src/container/Viewport.mjs';",
            "",
            "/**",
            " * @class " + appName + ".MainContainer",
            " * @extends Neo.container.Viewport",
            " */",
            "class MainContainer extends Viewport {",
            "    static getConfig() {return {",
            "        className: '" + appName + ".MainContainer',",
            "        ntype    : 'main-container',",
            "",
            "        autoMount: true,",
            "        layout   : {ntype: 'fit'},",
            "",
            "        items: [{",
            "            module: TabContainer,",
            "            height: 300,",
            "            width : 500,",
            "            style : {flex: 'none', margin: '20px'},",
            "",
            "            itemDefaults: {",
            "                module: Component,",
            "                cls   : ['neo-examples-tab-component'],",
            "                style : {padding: '20px'},",
            "            },",
            "",
            "            items: [{",
            "                tabButtonConfig: {",
            "                    iconCls: 'fa fa-home',",
            "                    text   : 'Tab 1'",
            "                },",
            "                vdom: {innerHTML: 'Welcome to your new Neo App.'}",
            "            }, {",
            "                tabButtonConfig: {",
            "                    iconCls: 'fa fa-play-circle',",
            "                    text   : 'Tab 2'",
            "                },",
            "                vdom: {innerHTML: 'Have fun creating something awesome!'}",
            "            }]",
            "        }]",
            "    }}",
            "}",
            "",
            "Neo.applyClassConfig(MainContainer);",
            "",
            "export {MainContainer as default};"
        ].join(os.EOL);

        if (!fs.existsSync(path.join(folder, 'view'))) {
            fs.mkdirSync(path.join(folder, 'view'));
        }

        fs.writeFileSync(path.join(folder, 'view/MainContainer.mjs'), mainContainerContent);

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
            name: appName,
            version: '0.1.0',
            private: true,
            scripts: {
                'server-start': 'webpack-dev-server --open'
            },
            dependencies: {
                'neo.mjs': '^1.0.12'
            },
            devDependencies: {
                'fsevents': '1.2.9', // npm i breaks without the specific include
                'webpack': '^4.41.2',
                'webpack-cli': '^3.3.10',
                'webpack-dev-server': '^3.9.0',
                'webpack-node-externals': '^1.7.2'
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