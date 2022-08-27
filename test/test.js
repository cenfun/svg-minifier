const path = require('path');
const EC = require('eight-colors');
const svgMinifier = require('../lib');

const tiktokHandler = ($svg, it, $) => {
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
};

const tests = {
    'my-icons': {
        dirs: [path.resolve(__dirname, 'icons/my-icons')],
        onSVGDocument: function($svg, it, $) {
            //const fill = $svg.attr('fill');
            //if (!fill) {
            //$svg.attr('fill', 'currentColor');
            //}

            tiktokHandler($svg, it, $);

        },

        metadata: {
            name: 'my-icons'
        }
    },
    'digital-numbers': {
        dirs: [path.resolve(__dirname, 'icons/digital-numbers')],
        metadata: {
            name: 'digital-numbers'
        }
    },
    'type-icons': {
        dirs: {
            outline: path.resolve(__dirname, '../node_modules/heroicons/24/outline'),
            solid: path.resolve(__dirname, '../node_modules/heroicons/24/solid'),
            t: path.resolve(__dirname, '../node_modules/@tabler/icons/icons')
        },

        //test exclude, - in filename before onSVGName
        exclude: ['*-*'],

        //outputMetadata: false,
        //outputRuntime: false,

        metadata: {
            readme: 'open source icons'
        }
    },
    'tiny-icons': {
        dirs: path.resolve(__dirname, '../node_modules/super-tiny-icons/images/svg'),
        onSVGName: function(name, item) {
            name = name.toLowerCase();
            name = name.split('_').join('-');
            return this.onSVGNameDefault(name, item);
        },
        onSVGDocument: function($svg, it, $) {
            tiktokHandler($svg, it, $);
        },
        metadata: {
            readme: 'super-tiny-icons/images/svg'
        }
    }
};

Object.keys(tests).forEach((namespace) => {

    console.log('====================================================');
    console.log(`generating ${EC.cyan(namespace)} ...`);

    const options = tests[namespace];

    options.namespace = namespace;
    options.outputDir = path.resolve(__dirname, 'dist');

    const time_start = Date.now();
    const metadata = svgMinifier(options);
    const duration = Date.now() - time_start;

    console.log(`generated ${EC.cyan(namespace)}: ${EC.green(metadata.icons.length)}  (${duration}ms)`);

});

