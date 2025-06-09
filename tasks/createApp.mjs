export default {
    init(appName, folder, fs, os, path) {
        const appContent = [
            "import Viewport from './view/Viewport.mjs';",
            "",
            "export const onStart = () => Neo.app({",
            "    mainView: Viewport,",
            "    name    : '" + appName + "'",
            "});"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'app.mjs'), appContent);
    }
};
