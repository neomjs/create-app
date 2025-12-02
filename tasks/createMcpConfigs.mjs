export default {
    init(workspace, fs, os, path) {
        const mcpRoot = path.join(workspace, 'ai/mcp/server');
        const configs = [
            {
                dir: 'github-workflow',
                content: {
                    "owner": "ADD_GITHUB_ORGANIZATION_HERE",
                    "repo" : "ADD_GITHUB_REPOSITORY_HERE"
                }
            },
            {
                dir: 'knowledge-base',
                content: {}
            },
            {
                dir: 'memory-core',
                content: {}
            }
        ];

        configs.forEach(config => {
            const dirPath = path.join(mcpRoot, config.dir);
            fs.mkdirpSync(dirPath);
            fs.writeFileSync(
                path.join(dirPath, 'config.json'),
                JSON.stringify(config.content, null, 4) + os.EOL
            );
        });
    }
};
