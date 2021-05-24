'use strict';

module.exports = {
    init: function(fs, os, path, workspace) {
        const docsPath = path.join(workspace, 'docs');

        // copy the full app
        fs.mkdirpSync(docsPath);
        fs.copySync(path.join(workspace, 'node_modules/neo.mjs/docs'), docsPath);

        // copy the resources folder
        const docsDevPath = path.join(workspace, 'dist/development/docs/resources');
        fs.mkdirpSync(docsDevPath);
        fs.copySync(path.join(workspace, 'node_modules/neo.mjs/docs/resources'), docsDevPath);

        // copy the resources folder
        const docsProdPath = path.join(workspace, 'dist/production/docs/resources');
        fs.mkdirpSync(docsProdPath);
        fs.copySync(path.join(workspace, 'node_modules/neo.mjs/docs/resources'), docsProdPath);

        const indexPath = path.join(docsPath, 'index.html');
        let indexData = fs.readFileSync(indexPath, 'utf8');

        indexData = indexData.replace("appPath         : 'docs/app.mjs'", "appPath         : '../../docs/app.mjs'");
        indexData = indexData.replace("'Stylesheet']",                    "'Stylesheet'],\n            resourcesPath   : '../node_modules/neo.mjs/resources/',\n            workerBasePath  : '../node_modules/neo.mjs/src/worker/'");
        indexData = indexData.replace("../src/",                          "../node_modules/neo.mjs/src/");

        fs.writeFileSync(indexPath, indexData, 'utf8');

        const srcPath  = [
                  '../../node_modules/neo.mjs/src/',
                  '../../../node_modules/neo.mjs/src/',
                  '../../../../node_modules/neo.mjs/src/'
              ],
              srcRegex = [
                  /..\/..\/src\//gi,
                  /..\/..\/..\/src\//gi,
                  /..\/..\/..\/..\/src\//gi
              ];

        const isFile = fileName => {
            return fs.lstatSync(fileName).isFile()
        };

        const parseFolder = (folderPath, index) => {
            let itemPath;

            fs.readdirSync(folderPath).forEach(itemName => {
                itemPath = path.join(folderPath, itemName);

                if (isFile(itemPath)) {
                    if (itemName.endsWith('.mjs')) {
                        fs.writeFileSync(itemPath, fs.readFileSync(itemPath, 'utf8').replace(srcRegex[index], srcPath[index]), 'utf8');
                    }
                } else {
                    parseFolder(itemPath, index + 1);
                }
            });
        };

        parseFolder(path.join(docsPath, 'app'), 0);
    }
};
