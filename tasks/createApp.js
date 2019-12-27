'use strict';

module.exports = {
    init: function (appName, folder, fs, path, os) {
        const appContent = [
            "import MainContainer from './view/MainContainer.mjs';",
            "",
            "Neo.onStart = function() {",
            "    Neo.app({",
            "        appPath : './',",
            "        mainView: MainContainer,",
            "        name    : '" + appName + "'",
            "    });",
            "};"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);
    }
};