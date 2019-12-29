'use strict';

module.exports = {
    init: function(fs, os, path, workspace) {
        const docsPath = path.join(workspace, 'docs');

        fs.mkdirpSync(docsPath, err => {
            if (err) {
                throw err;
            }
        });

        fs.copySync(path.join(workspace, 'node_modules/neo.mjs/docs'), docsPath);

        const indexPath = path.join(docsPath, 'index.html');
        let indexData = fs.readFileSync(indexPath, 'utf8');

        indexData = indexData.replace("appPath       : 'docs/app.mjs'", "appPath       : '../../docs/app.mjs'");
        indexData = indexData.replace("isExperimental: true",           "isExperimental: true,\n            workerBasePath: '../node_modules/neo.mjs/src/worker/'");
        indexData = indexData.replace('../src/',                        '../node_modules/neo.mjs/src/');

        console.log(indexData);

        fs.writeFileSync(indexPath, indexData, 'utf8');
    }
};