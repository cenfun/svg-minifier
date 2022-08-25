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
    namespace: 'my-icons',
    dirs: [path.resolve(__dirname, 'icons')],
    exclude: [],
    excludeSubDir: false,

    outputDir: path.resolve(__dirname, 'dist'),
    outputMetadata: true,
    outputRuntime: true,

    onSVGName: function(name, item) {
        return this.onSVGNameDefault(name, item);
    },
    

    onSVGDocument: function($svg, item, $) {

    },

    onSVGError: function(result, item, $) {
        return this.onSVGErrorDefault(result, item, $);
    },

    //additional metadata
    metadata: {
        key: 'value'
    },

    svgo: {}

});

console.log(metadata);

```
see [options](lib/options.js)
# With type for svg name
```js
svgMinifier({
    namespace: 'my-icons',
    dirs: [{
        //name = [svg-name]-[type-name]
        outline: path.resolve(__dirname, 'icons/outline'),
        solid: path.resolve(__dirname, 'icons/solid')
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

* 1.0.3
    - added options: onSVGError
    - fixed svgo xml content error with $.html('svg')
    - fixed blank svg error

* 1.0.2
    - added options: outputMetadata/outputRuntime

* 1.0.1
    - added options: excludeSubDir 

* 1.0.0
