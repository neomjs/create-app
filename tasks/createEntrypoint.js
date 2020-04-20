'use strict';

module.exports = {
    init: function(appName, fs, os, path, workspace) {
        const entrypointPath = path.join(workspace, 'buildScripts/entrypoints'),
              appEntrypoint  = path.join(entrypointPath, appName + '.mjs');

        fs.mkdirpSync(entrypointPath);

        let entryData = [
            "import '../../node_modules/neo.mjs/src/worker/App.mjs';",
            "import '../../apps/" + (appName.toLowerCase()) + "/app.mjs';"
        ].join(os.EOL);

        fs.writeFileSync(appEntrypoint, entryData, 'utf8');

        entryData = [
            "import '../../node_modules/neo.mjs/src/worker/App.mjs';",
            "import '../../docs/app.mjs';"
        ].join(os.EOL);

        fs.writeFileSync(path.join(entrypointPath, 'Docs.mjs'), entryData, 'utf8');
    }
};