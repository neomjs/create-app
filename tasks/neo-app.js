#!/usr/bin/env node

'use strict';

const fs       = require('fs'),
      path     = require('path'),
      appName  = 'MyApp',
      lAppName = appName.toLowerCase(),
      appPath  = 'apps/' + lAppName + '/',
      folder   = 'myapp';

console.log('Create neo.mjs app');

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

fs.mkdir(folder, { recursive: true }, (err) => {
    if (err) {
        throw err;
    }

    const appContent = [
        "import MainContainer from './MainContainer.mjs';",
        "",
        "Neo.onStart = function() {",
        "    Neo.app({",
        "        appPath : '" + appPath + "',",
        "        mainView: MainContainer,",
        "        name    : '" + appName + "'",
        "    });",
        "};"
    ].join('\n');

    fs.writeFileSync(folder + '/app.mjs', appContent);

    // Cleanup
    handleExit();
});