export default {
    init(folder, fs, os, path, __dirname) {
        if (!fs.existsSync(path.join(folder, 'src/main/addon'))) {
            fs.mkdirpSync(path.join(folder, 'src/main/addon'));
        }

        fs.copySync(
            path.join(__dirname, '../resources/MicroLoader.mjs'),
            path.join(folder, 'src/MicroLoader.mjs')
        );

        const readmeContent = [
            "# Drop custom main thread addons into this folder",
            "Example: you create a file here called `MyAddon.mjs`.",
            "Then you can drop it into the `neo-config.json` files inside the root level of your apps",
            "using a 'WS/' prefix.",
            "",
            '"mainThreadAddons": ["DragDrop", "Stylesheet", "WS/MyAddon"]'
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, 'src/main/addon/README.md'), readmeContent);
    }
};
