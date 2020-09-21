'use strict';

module.exports = {
    init: function(workspace, fs, os, path) {
        const scssPath = path.join(workspace, 'buildScripts/webpack/entrypoints/scss');
        let content;

        fs.mkdirpSync(scssPath);

        content = [
            "import './scss_structure.scss';"
        ].join(os.EOL);

        fs.writeFileSync(path.join(scssPath, 'scss_structure.scss.mjs'), content);
    }
};