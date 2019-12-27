#!/usr/bin/env node

'use strict';

console.log('Create neo.mjs app');

const chalk       = require('chalk'),
      commander   = require('commander'),
      cp          = require('child_process'),
      fs          = require('fs'),
      inquirer    = require('inquirer'),
      os          = require('os'),
      path        = require('path'),
      packageJson = require('../package.json');

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .allowUnknownOption()
    .on("--help", () => {
        console.log();
        console.log(`In case you have any issues, please create a ticket here:`);
        console.log(`${chalk.cyan(packageJson.bugs.url)}`);
        console.log();
    })
    .parse(process.argv);

console.log(program);

// npm binary based on OS
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';

const questions = [{
    type   : 'input',
    name   : 'workspace',
    message: 'Please choose a name for your neo workspace:',
    default: 'workspace'
}, {
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

const handleError = e => {
    console.error('ERROR! An error was encountered while executing');
    console.error(e);
    console.log('Exiting with error.');
    process.exit(1);
};

const handleExit = () => {
    console.log('Exiting without error.');
    process.exit();
};

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

inquirer.prompt(questions).then(answers => {
    const workspace = answers['workspace'],
          appName   = answers['appName'],
          lAppName  = appName.toLowerCase(),
          appPath   = 'apps/' + lAppName + '/',
          folder    = lAppName;

    console.log(workspace);

    fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) {
            throw err;
        }

        require('./createApp')          .init(appName, folder, fs, os, path);
        require('./createIndexHtml')    .init(answers, appName, folder, fs, os, path);
        require('./createMainContainer').init(appName, folder, fs, os, path);
        require('./createGitignore')    .init(folder, fs, os, path);
        require('./createPackageJson')  .init(appName, folder, fs, os, path);

        // npm install
        cp.spawnSync(npmCmd, ['i'], { env: process.env, cwd: folder, stdio: 'inherit' });

        // Cleanup
        handleExit();
    });
});