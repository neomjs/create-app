export default {
    init(folder, fs, os, path) {
        const settingsJson = {
            "context": {
                "fileName": ["AGENTS.md", "GEMINI.md"]
            },
            "mcpServers": {
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
                },
                "neo.mjs-neural-link": {
                    "command": "npm",
                    "args"   : ["run", "ai:mcp-server-neural-link"]
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
