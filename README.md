# SVG Minifier
minify svg files

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

    outputDir: path.resolve(__dirname, 'dist'),

    onSVGName: function(name, item) {
        return this.onSVGNameDefault(name, item);
    },

    onSVGDocument: function($svg, item) {

    },

    //additional metadata
    metadata: {
        key: 'value'
    },

    svgo: {}

});

console.log(metadata);

```
see [config](lib/config.js)
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

* 1.0.0
