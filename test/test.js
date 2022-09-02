const path = require('path');
const EC = require('eight-colors');
const CG = require('console-grid');
const svgMinifier = require('../lib');

const tiktokHandler = ($svg, item, $) => {
    //only for tiktok
    if (item.name === 'tiktok') {

        //console.log($.html());

        //console.log('DTD==============================');
        //directive

        const directive = $.root()[0].children.find((c) => c.type === 'directive');

        console.log(directive.data);

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

        onSVGContent: function(content, item) {
            if (item.name === 'content') {
                //console.log(item);
                return content.split('{placeholder}').join('content');
            }
        },

        onSVGDocument: function($svg, item, $) {
            //const fill = $svg.attr('fill');
            //if (!fill) {
            //$svg.attr('fill', 'currentColor');
            //}

            if (['ada', 'augeas'].includes(item.name)) {
                $svg.attr('viewBox', '0 0 512 512');
                $svg.attr('fill', 'currentColor');
                return;
            }

            tiktokHandler($svg, item, $);

        },

        onSVGOptimized: function($svg, item, $) {
            if (['ada', 'augeas'].includes(item.name)) {
                ['g', 'path'].forEach((tag) => {
                    $svg.find(tag).each((i, it) => {
                        const $elem = $(it);
                        const fill = $elem.attr('fill');
                        if (fill && fill !== 'none') {
                            $elem.attr('fill', 'currentColor');
                        }
                        const stroke = $elem.attr('stroke');
                        if (stroke && stroke !== 'none') {
                            $elem.attr('stroke', 'currentColor');
                        }
                    });
                });
            }
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
            hero: path.resolve(__dirname, '../node_modules/heroicons/24/solid'),
            tabler: path.resolve(__dirname, '../node_modules/@tabler/icons/icons')
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
        onSVGDocument: function($svg, item, $) {
            tiktokHandler($svg, item, $);
        },
        metadata: {
            readme: 'super-tiny-icons/images/svg'
        }
    }
};

const rows = [];

Object.keys(tests).forEach((id) => {

    console.log('====================================================');
    console.log(`generating ${EC.cyan(id)} ...`);

    const options = tests[id];

    //silent test
    //options.silent = true;

    options.id = id;
    options.outputDir = path.resolve(__dirname, 'dist');

    const time_start = Date.now();
    const metadata = svgMinifier(options);

    const duration = `${Date.now() - time_start} ms`;
    rows.push([id, duration]);

    console.log(`generated ${EC.cyan(id)}: ${EC.green(metadata.icons.length)}  (${EC.magenta(duration)})`);

});

CG({
    columns: ['Name', {
        name: 'Duration',
        align: 'right'
    }],
    rows
});

/*

┌─────────────────┬──────────┐
│ Name            │ Duration │
├─────────────────┼──────────┤
│ my-icons        │   187 ms │
│ digital-numbers │    58 ms │
│ type-icons      │  1450 ms │
│ tiny-icons      │   494 ms │
└─────────────────┴──────────┘

*/
