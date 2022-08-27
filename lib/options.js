const EC = require('eight-colors');

module.exports = () => {
    return {

        namespace: 'my-icons',

        dirs: [],

        exclude: [],
        excludeSubDir: false,

        outputDir: 'dist',
        outputMetadata: true,
        outputRuntime: true,

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

        onSVGDocument: function($svg, item, $) {
        //svg DOM handler
        },

        onSVGErrorDefault: function(result, item, $) {
            if (result.error) {
                EC.logRed(result.error);
            }
        },

        onSVGError: function(result, item, $) {
            return this.onSVGErrorDefault(result, item, $);
        },

        //additional metadata
        metadata: {},

        //https://github.com/svg/svgo
        svgo: {
            plugins: [{
                name: 'cleanupIDs',
                params: {
                    prefix: '{prefix}-'
                }
            }, {
                name: 'removeStyleElement'
            }, {
                name: 'removeScriptElement'
            }],
            multipass: true
        }
    };

};
