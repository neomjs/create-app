export default {
    init(folder, fs, os, path) {
        const settingsJson = {
            "context": {
                "fileName": ["AGENTS.md", "GEMINI.md"]
            },
            "mcpServers": {
                "chrome-devtools": {
                    "command": "npx",
                    "args"   : ["-y", "chrome-devtools-mcp@latest"]
                },
                "neo.mjs-github-workflow": {
                    "command": "npm",
                    "args"   : ["run", "ai:mcp-server-github-workflow"]
                },
                "neo.mjs-knowledge-base": {
                    "command": "npm",
                    "args"   : ["run", "ai:mcp-server-knowledge-base"]
                },
                "neo.mjs-memory-core": {
                    "command": "npm",
                    "args"   : ["run", "ai:mcp-server-memory-core"]
                }
            }
        };

        fs.mkdirpSync(path.join(folder, '.gemini'));

        fs.writeFileSync(
            path.join(folder, '.gemini/settings.json'),
            JSON.stringify(settingsJson, null, 4) + os.EOL
        );
    }
};
