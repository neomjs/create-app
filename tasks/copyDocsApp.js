'use strict';

module.exports = {
    init: function(fs, path, workspace) {
        const docsPath = path.join(workspace, 'docs');

        fs.mkdirSync(docsPath, err => {
            if (err) {
                throw err;
            }
        });

        fs.copySync(path.join(workspace, 'node_modules/neo.mjs/docs'), docsPath);
    }
};