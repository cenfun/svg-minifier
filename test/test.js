const path = require('path');

const svgMinifier = require('../lib');

['my-icons', 'digital-numbers'].forEach((item) => {

    console.log('====================================================');
    console.log(`generating ${item} ...`);

    const metadata = svgMinifier({
        namespace: item,
        dirs: [path.resolve(__dirname, `icons/${item}`)],

        //test sub dir
        //excludeSubDir: true,

        outputDir: path.resolve(__dirname, 'dist'),

        onSVGDocument: function($svg) {
            //const fill = $svg.attr('fill');
            //if (!fill) {
            //$svg.attr('fill', 'currentColor');
            //}
        },

        metadata: {
            readme: item
        }
    });

    console.log(metadata.icons.length);

});


console.log('====================================================');
console.log('generating type icons ...');

const dirs = {
    outline: path.resolve(__dirname, '../node_modules/heroicons/outline'),
    solid: path.resolve(__dirname, '../node_modules/heroicons/solid'),
    t: path.resolve(__dirname, '../node_modules/@tabler/icons/icons')
};

const metadata = svgMinifier({
    namespace: 'type-icons',
    dirs: dirs,
    outputDir: path.resolve(__dirname, 'dist'),

    metadata: {
        readme: 'open source icons'
    }
});

console.log(metadata.icons.length);
