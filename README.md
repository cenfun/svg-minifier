# SVG Minifier
> A tool to minify svg files

# Install
```sh
npm i svg-minifier
```

# Usage
```js
const svgMinifier = require('svg-minifier');
const metadata = svgMinifier({
    id: 'my-icons',
    dirs: [path.resolve(__dirname, 'icons')],
    exclude: [],
    excludeSubDir: false,

    outputDir: path.resolve(__dirname, 'dist'),
    outputMetadata: true,
    outputRuntime: true,

    silent: false,
    logDuplicates: true,

    onSVGName: function(name, item) {
        return this.onSVGNameDefault(name, item);
    },
    
    //original svg file content
    onSVGContent: function(content, item) {
        //svg content handler
    },

    //cheerio DOM (jQuery API)
    onSVGDocument: function($svg, item, $) {
        //svg DOM handler
    },

    //cheerio DOM after optimized
    onSVGOptimized: function($svg, item, $) {
        //svg DOM handler
    },

    //optimize failed
    onSVGError: function(result, item, $) {
        return this.onSVGErrorDefault(result, item, $);
    },

    onFinish: function(options, metadata) {

    },

    //additional metadata
    metadata: {
        key: 'value'
    },

    //svgo config (SVG Optimizer)
    svgo: {}

});

console.log(metadata);

```
see [options](lib/options.js)
# With type for svg name
```js
svgMinifier({
    id: 'my-icons',
    dirs: ['icons/solid', {
        //name = [svg-name]-[type-name]
        outline: 'icons/outline'
    }]
});
```

# Test
```
npm run test
```
see [test](test/test.js)

## Link
* [https://github.com/svg/svgo](https://github.com/svg/svgo)
* [https://github.com/pieroxy/lz-string](https://github.com/pieroxy/lz-string)

## Changelog

* 1.0.9
    - used runtime template
    - added logDuplicates option
    - added onFinish option
