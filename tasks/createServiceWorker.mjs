export default {
    init(appName, folder, fs, os, path) {
        const serviceWorkerContent = [
            "import Neo         from '../node_modules/neo.mjs/src/Neo.mjs';",
            "import * as core   from '../node_modules/neo.mjs/src/core/_export.mjs';",
            "import ServiceBase from '../node_modules/neo.mjs/src/worker/ServiceBase.mjs';",
            "",
            "/**",
            " * @class Neo.ServiceWorker",
            " * @extends Neo.worker.ServiceBase",
            " * @singleton",
            " */",
            "class ServiceWorker extends ServiceBase {",
            "    static getConfig() {return {",
            "        /**",
            "         * @member {String} className='Neo.ServiceWorker'",
            "         * @protected",
            "         */",
            "        className: 'Neo.ServiceWorker',",
            "        /**",
            "         * @member {Boolean} singleton=true",
            "         * @protected",
            "         */",
            "        singleton: true,",
            "        /**",
            "         * @member {String} workerId='service'",
            "         * @protected",
            "         */",
            "        workerId: 'service'",
            "    }}",
            "}",
            "",
            "Neo.applyClassConfig(ServiceWorker);",
            "",
            "let instance = Neo.create(ServiceWorker);",
            "",
            "Neo.applyToGlobalNs(instance);",
            "",
            "export default instance;"
        ].join(os.EOL);

        fs.writeFileSync(path.join(folder, '../ServiceWorker.mjs'), serviceWorkerContent);
    }
};
