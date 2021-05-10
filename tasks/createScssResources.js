'use strict';

module.exports = {
    init: function(appName, workspace, fs, os, path) {
        const lAppName       = appName.toLowerCase(),
              resourcesPath  = path.join(workspace, 'resources/scss'),
              srcPath        = path.join(resourcesPath, 'src'),
              themeDarkPath  = path.join(resourcesPath, 'theme-dark'),
              themeLightPath = path.join(resourcesPath, 'theme-light');

        fs.mkdirpSync(path.join(srcPath,        'apps', lAppName));
        fs.mkdirpSync(path.join(themeDarkPath,  'apps', lAppName));
        fs.mkdirpSync(path.join(themeLightPath, 'apps', lAppName));

        fs.writeFileSync(path.join(themeDarkPath,  '_all.scss'), ['@import "apps/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeLightPath, '_all.scss'), ['@import "apps/all";'].join(os.EOL));

        fs.writeFileSync(path.join(themeDarkPath,  'apps', '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));
        fs.writeFileSync(path.join(themeLightPath, 'apps', '_all.scss'), ['@import "' + lAppName + '/all";'].join(os.EOL));

        fs.writeFileSync(path.join(themeDarkPath,  'apps', lAppName, '_all.scss'), os.EOL);
        fs.writeFileSync(path.join(themeLightPath, 'apps', lAppName, '_all.scss'), os.EOL);
    }
};
