export default {
    init(appName, folder, fs, os, path) {
        const mainContainerContent = [
            "import Component    from '../../../node_modules/neo.mjs/src/component/Base.mjs';",
            "import TabContainer from '../../../node_modules/neo.mjs/src/tab/Container.mjs';",
            "import Viewport     from '../../../node_modules/neo.mjs/src/container/Viewport.mjs';",
            "",
            "/**",
            " * @class " + appName + ".view.MainContainer",
            " * @extends Neo.container.Viewport",
            " */",
            "class MainContainer extends Viewport {",
            "    static config = {",
            "        /**",
            "         * @member {String} className='" + appName + ".view.MainContainer'",
            "         * @protected",
            "         */",
            "        className: '" + appName + ".view.MainContainer',",
            "        /**",
            "         * @member {Boolean} autoMount=true",
            "         */",
            "        autoMount: true,",
            "        /**",
            "         * @member {Object[]} items",
            "         */",
            "        items: [{",
            "            module: TabContainer,",
            "            height: 300,",
            "            width : 500,",
            "            style : {flex: 'none', margin: '20px'},",
            "",
            "            itemDefaults: {",
            "                module: Component,",
            "                cls   : ['neo-examples-tab-component'],",
            "                style : {padding: '20px'},",
            "            },",
            "",
            "            items: [{",
            "                header: {",
            "                    iconCls: 'fa fa-home',",
            "                    text   : 'Tab 1'",
            "                },",
            "                vdom: {innerHTML: 'Welcome to your new Neo App.'}",
            "            }, {",
            "                header: {",
            "                    iconCls: 'fa fa-play-circle',",
            "                    text   : 'Tab 2'",
            "                },",
            "                vdom: {innerHTML: 'Have fun creating something awesome!'}",
            "            }]",
            "        }],",
            "        /*",
            "         * @member {Object} layout={ntype:'fit'}",
            "         */",
            "        layout: {ntype: 'fit'}",
            "    }",
            "}",
            "",
            "export default Neo.setupClass(MainContainer);"
        ].join(os.EOL);

        if (!fs.existsSync(path.join(folder, 'view'))) {
            fs.mkdirSync(path.join(folder, 'view'));
        }

        fs.writeFileSync(path.join(folder, 'view/MainContainer.mjs'), mainContainerContent);
    }
};
