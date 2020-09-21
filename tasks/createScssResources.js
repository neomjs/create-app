'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        const resourcesPath  = path.join(workspace, 'resources/scss'),
              srcPath        = path.join(resourcesPath, 'src'),
              themeDarkPath  = path.join(resourcesPath, 'theme-dark'),
              themeLightPath = path.join(resourcesPath, 'theme-light');

        fs.mkdirpSync(srcPath);
        fs.mkdirpSync(themeDarkPath);
        fs.mkdirpSync(themeLightPath);
    }
};