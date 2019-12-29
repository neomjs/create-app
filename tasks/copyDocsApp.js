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

        fs.writeFileSync(indexPath, indexData, 'utf8');

        const srcRegex = /..\/..\/..\/src\//gi;
        const srcPath  = '../../../node_modules/neo.mjs/src/';

        const apiTreeListPath = path.join(docsPath, 'app/view/ApiTreeList.mjs');
        fs.writeFileSync(apiTreeListPath, fs.readFileSync(apiTreeListPath, 'utf8').replace(srcRegex, srcPath), 'utf8');

        const contentTabContainerPath = path.join(docsPath, 'app/view/ContentTabContainer.mjs');
        fs.writeFileSync(contentTabContainerPath, fs.readFileSync(contentTabContainerPath, 'utf8').replace(srcRegex, srcPath), 'utf8');

        const examplesTreeListPath = path.join(docsPath, 'app/view/ExamplesTreeList.mjs');
        fs.writeFileSync(examplesTreeListPath, fs.readFileSync(examplesTreeListPath, 'utf8').replace(srcRegex, srcPath), 'utf8');

        const mainContainerPath = path.join(docsPath, 'app/view/MainContainer.mjs');
        fs.writeFileSync(mainContainerPath, fs.readFileSync(mainContainerPath, 'utf8').replace(srcRegex, srcPath), 'utf8');
    }
};