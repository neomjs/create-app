'use strict';

module.exports = {
    init: function (appName, folder, fs, os, path) {
        const appContent = [
            "import MainContainer from './MainContainer.mjs';",
            "",
            "const onStart = () => Neo.app({",
            "    appPath : 'apps/" + appName.toLowerCase() + "/',",
            "    mainView: MainContainer,",
            "    name    : '" + appName + "'",
            "});",
            "",
            "export {onStart as onStart};"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);
    }
};