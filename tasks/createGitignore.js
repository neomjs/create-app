'use strict';

module.exports = {
    init: function (folder, fs, path, os) {
        const gitignoreContent = [
            "# See http://help.github.com/ignore-files/ for more about ignoring files.",
            "",
            "package-lock.json",
            "",
            "# dependencies",
            "/node_modules",
            "",
            "# IDEs and editors",
            "/.idea",
            ".project",
            ".classpath",
            "*.launch",
            ".settings",
            ".vscode/",
            "",
            "#System Files",
            ".DS_Store",
            "Thumbs.db"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, '.gitignore'), gitignoreContent);
    }
};