export default {
    init(appName, folder, fs, os, path) {
        const indexContent = [
            '<!DOCTYPE HTML>',
            '<html>',
            '<head>',
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <meta charset="UTF-8">',
            '    <title>' + appName + '</title>',
            '</head>',
            '<body>',
            '    <script src="../../src/MicroLoader.mjs" type="module"></script>',
            '</body>',
            '</html>',
        ];

        fs.writeFileSync(path.join(folder, 'index.html'), indexContent.join(os.EOL));
    }
};
