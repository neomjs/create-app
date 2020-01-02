'use strict';

module.exports = {
    init: function(appName, fs, os, path, workspace) {
        const entrypointPath = path.join(workspace, 'buildScripts/entrypoints'),
              appEntrypoint  = path.join(entrypointPath, appName + '.mjs');

        fs.mkdirpSync(entrypointPath);

        const entryData = [
            "import '../../node_modules/neo.mjs/src/worker/App.mjs';",
            "import '../../apps/" + appName + "/app.mjs';"
        ].join(os.EOL);

        fs.writeFileSync(appEntrypoint, entryData, 'utf8');
    }
};