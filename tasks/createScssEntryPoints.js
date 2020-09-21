'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        fs.mkdirpSync(path.join(workspace, 'buildScripts/webpack/entrypoints/scss'));
    }
};