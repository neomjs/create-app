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
        indexData = indexData.replace("});",           "resourcesPath   : '../node_modules/neo.mjs/resources/',\n            workerBasePath  : '../node_modules/neo.mjs/src/worker/'\n        });");
        indexData = indexData.replace('../src/',                        '../node_modules/neo.mjs/src/');

        fs.writeFileSync(indexPath, indexData, 'utf8');

        const srcRegex = /..\/..\/..\/src\//gi,
              srcPath  = '../../../node_modules/neo.mjs/src/';

        function adjustPaths(cls) {
            const clsPath = path.join(docsPath, 'app', cls);
            fs.writeFileSync(clsPath, fs.readFileSync(clsPath, 'utf8').replace(srcRegex, srcPath), 'utf8');
        }

        adjustPaths('model/Api.mjs');
        adjustPaths('model/Example.mjs');
        adjustPaths('model/Tutorial.mjs');

        adjustPaths('store/Api.mjs');
        adjustPaths('store/Examples.mjs');
        adjustPaths('store/Tutorials.mjs');

        adjustPaths('view/ApiTreeList.mjs');
        adjustPaths('view/ContentTabContainer.mjs');
        adjustPaths('view/ExamplesTreeList.mjs');
        adjustPaths('view/HeaderContainer.mjs');
        adjustPaths('view/MainContainer.mjs');
        adjustPaths('view/MainContainerController.mjs');
        adjustPaths('view/TutorialsTreeList.mjs');

        const subSrcRegex = /..\/..\/..\/..\/src\//gi,
              subSrcPath  = '../../../../node_modules/neo.mjs/src/';

        function adjustSubPaths(cls) {
            const clsPath = path.join(docsPath, 'app/view', cls);
            fs.writeFileSync(clsPath, fs.readFileSync(clsPath, 'utf8').replace(subSrcRegex, subSrcPath), 'utf8');
        }

        adjustSubPaths('classdetails/HeaderComponent.mjs');
        adjustSubPaths('classdetails/HierarchyTreeList.mjs');
        adjustSubPaths('classdetails/MainContainer.mjs');
        adjustSubPaths('classdetails/MainContainerController.mjs');
        adjustSubPaths('classdetails/MembersList.mjs');
        adjustSubPaths('classdetails/SourceViewComponent.mjs');
        adjustSubPaths('classdetails/TutorialComponent.mjs');

        const examplesSrc   = path.join(docsPath, 'examples.json'),
              examplesRegex = /..\/..\/..\/examples\//gi,
              examplesPath  = '../../../node_modules/neo.mjs/examples/';

        fs.writeFileSync(examplesSrc, fs.readFileSync(examplesSrc, 'utf8').replace(examplesRegex, examplesPath), 'utf8');
    }
};