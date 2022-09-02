module.exports = () => {
    return {

        id: 'svg-minifier',

        dirs: [],

        exclude: [],
        excludeSubDir: false,

        outputDir: 'dist',
        outputMetadata: true,
        outputRuntime: true,

        silent: false,

        onSVGName: function(name, item) {
            return this.onSVGNameDefault(name, item);
        },

        onSVGContent: function(content, item) {
            //svg content handler
        },

        onSVGDocument: function($svg, item, $) {
            //svg DOM handler
        },

        onSVGOptimized: function($svg, item, $) {
            //svg DOM handler
        },

        onSVGError: function(result, item, $) {
            return this.onSVGErrorDefault(result, item, $);
        },

        //additional metadata
        metadata: {},

        //https://github.com/svg/svgo
        svgo: {
            plugins: [{
                name: 'preset-default',
                params: {
                    overrides: {
                        inlineStyles: {
                            onlyMatchedOnce: false
                        },
                        cleanupIDs: {
                            prefix: '{prefix}-'
                        }
                    }
                }
            }, {
                name: 'convertStyleToAttrs'
            }, {
                name: 'removeStyleElement'
            }, {
                name: 'removeScriptElement'
            }],
            multipass: true
        }
    };

};
