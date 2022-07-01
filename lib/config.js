const EC = require('eight-colors');

module.exports = {

    namespace: 'my-svg',

    dirs: [],

    exclude: [],

    outputDir: '',

    onSVGNameDefault: function(name, item) {
        if (item.type) {
            name = `${name}-${item.type}`;
        }
        const nameReg = /^[a-z0-9-.]+$/g;
        const nameTest = nameReg.test(name);
        if (!nameTest) {
            EC.logRed(`ERROR: "${name}" does not match "lowercase-dashed": ${item.filePath}`);
            return;
        }
        return name;
    },

    onSVGName: function(name, item) {
        return this.onSVGNameDefault(name, item);
    },

    onSVGDocument: function($svg, item) {

    },

    //additional metadata
    metadata: {},

    //https://github.com/svg/svgo
    svgo: {
        multipass: true
        // plugins: [
        //     // {
        //     //     name: 'preset-default',
        //     //     params: {
        //     //         overrides: {
        //     //             //removeDoctype: false
        //     //         }
        //     //     }
        //     // },
        //     'removeStyleElement',
        //     'removeScriptElement'
        // ]
    }
};
