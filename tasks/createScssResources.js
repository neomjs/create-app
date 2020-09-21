'use strict';

module.exports = {
    init: function(appName, workspace, fs, os, path) {
        const lAppName       = appName.toLowerCase(),
              resourcesPath  = path.join(workspace, 'resources/scss'),
              srcPath        = path.join(resourcesPath, 'src'),
              themeDarkPath  = path.join(resourcesPath, 'theme-dark'),
              themeLightPath = path.join(resourcesPath, 'theme-light');

        fs.mkdirpSync(path.join(srcPath,        lAppName));
        fs.mkdirpSync(path.join(themeDarkPath,  lAppName));
        fs.mkdirpSync(path.join(themeLightPath, lAppName));

        fs.writeFileSync(path.join(srcPath,        '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeDarkPath,  '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeLightPath, '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));

        fs.writeFileSync(path.join(srcPath,        lAppName, '_all.scss'), os.EOL);
        fs.writeFileSync(path.join(themeDarkPath,  lAppName, '_all.scss'), os.EOL);
        fs.writeFileSync(path.join(themeLightPath, lAppName, '_all.scss'), os.EOL);
    }
};