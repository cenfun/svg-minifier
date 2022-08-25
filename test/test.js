const path = require('path');
const EC = require('eight-colors');
const svgMinifier = require('../lib');

['my-icons', 'digital-numbers'].forEach((item) => {

    console.log('====================================================');
    console.log(`generating ${item} ...`);

    const time_start = Date.now();
    const metadata = svgMinifier({
        namespace: item,
        dirs: [path.resolve(__dirname, `icons/${item}`)],

        //test sub dir
        //excludeSubDir: true,

        outputDir: path.resolve(__dirname, 'dist'),

        onSVGDocument: function($svg, it, $) {
            //const fill = $svg.attr('fill');
            //if (!fill) {
            //$svg.attr('fill', 'currentColor');
            //}

            //only for tiktok
            if (it.name === 'tiktok') {

                //console.log($.html());

                //console.log('DTD==============================');
                //directive

                const directive = $.root()[0].children.find((c) => c.type === 'directive');
                const d = directive.data.split('"')[1];
                EC.logYellow(`tiktok replacement: ${d}`);
                $.root().find('[d="&z;"]').attr('d', d);

                //console.log('==================================');

                //console.log($.html());

            }

        },

        metadata: {
            name: item
        }
    });
    const duration = Date.now() - time_start;

    console.log(metadata.icons.length, `${duration}ms`);

});


console.log('====================================================');
console.log('generating type icons ...');

const dirs = {
    outline: path.resolve(__dirname, '../node_modules/heroicons/24/outline'),
    solid: path.resolve(__dirname, '../node_modules/heroicons/24/solid'),
    t: path.resolve(__dirname, '../node_modules/@tabler/icons/icons')
};

const time_start = Date.now();
const metadata = svgMinifier({
    namespace: 'type-icons',
    dirs: dirs,

    //test exclude, - in filename before onSVGName
    exclude: ['*-*'],

    outputDir: path.resolve(__dirname, 'dist'),

    outputMetadata: false,
    //outputRuntime: false,

    metadata: {
        readme: 'open source icons'
    }
});

const duration = Date.now() - time_start;

//2866, 4.9s
//703 1.5s
console.log(metadata.icons.length, `${duration}ms`);
