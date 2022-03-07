export default {
    init(appName, folder, fs, os, path) {
        const appContent = [
            "import MainContainer from './view/MainContainer.mjs';",
            "",
            "export const onStart = () => Neo.app({",
            "    appPath : 'apps/" + appName.toLowerCase() + "/',",
            "    mainView: MainContainer,",
            "    name    : '" + appName + "'",
            "});"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);
    }
};
