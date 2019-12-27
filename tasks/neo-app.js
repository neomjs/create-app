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

        require('./createApp')          .init(appName, folder, fs, path, os);
        require('./createIndexHtml')    .init(answers, appName, folder, fs, path, os);
        require('./createMainContainer').init(appName, folder, fs, path, os);
        require('./createGitignore')    .init(folder, fs, path, os);
        require('./createPackageJson')  .init(appName, folder, fs, path, os);

        // npm install
        cp.spawnSync(npmCmd, ['i'], { env: process.env, cwd: folder, stdio: 'inherit' });

        // Cleanup
        handleExit();
    });
});