const fs = require('fs');
const path = require('path');
const EC = require('eight-colors');
const CG = require('console-grid');
const cheerio = require('cheerio');
const URT = require('umd-runtime-templates');

const compress = require('lz-utils/lib/compress.js');
const { optimize } = require('svgo');
const ignore = require('ignore');

const defaultOptions = require('./options.js');

//global singleton
let options = defaultOptions();

//================================================================================================

const log = (str) => {
    if (options.silent) {
        return;
    }
    console.log(`${EC.cyan(`[${options.id}]`)} ${str}`);
};

const formatPath = function(str) {
    if (str) {
        str = str.replace(/\\/g, '/');
    }
    return str;
};

const relativePath = (p) => {
    return formatPath(path.relative(process.cwd(), p));
};

const readFileContentSync = function(filePath) {
    let content = null;
    const isExists = fs.existsSync(filePath);
    if (isExists) {
        content = fs.readFileSync(filePath);
        if (Buffer.isBuffer(content)) {
            content = content.toString('utf8');
        }
    }
    return content;
};

const writeFileContentSync = function(filePath, content, force = true) {
    const isExists = fs.existsSync(filePath);
    if (force || isExists) {
        const p = path.dirname(filePath);
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, {
                recursive: true
            });
        }
        fs.writeFileSync(filePath, content);
        return true;
    }
    return false;
};

//================================================================================================

const defaultCallbacks = {

    onSVGNameDefault: function(name, item) {
        if (item.type) {
            name = `${name}-${item.type}`;
        }
        const nameReg = /^[a-z0-9-.]+$/g;
        const nameTest = nameReg.test(name);
        if (!nameTest) {
            log(EC.red(`ERROR: "${name}" does not match "lowercase-dashed": ${item.filePath}`));
            return;
        }
        return name;
    },

    onSVGErrorDefault: function(result, item, $) {
        if (result.error) {
            log(EC.red(result.error));
        }
    }

};

//================================================================================================

const forEachSvg = function(dir, excludeSubDir, callback) {
    if (!fs.existsSync(dir)) {
        return;
    }
    const list = fs.readdirSync(dir);
    list.forEach(function(name) {
        const abs = path.resolve(dir, name);
        const info = fs.statSync(abs);
        if (info.isDirectory()) {
            if (!excludeSubDir) {
                forEachSvg(abs, excludeSubDir, callback);
            }
        } else {
            const relPath = relativePath(abs);
            if (path.extname(name) === '.svg') {
                callback(relPath);
            }
        }
    });
};

const generateSvgFiles = () => {
    let dirs = options.dirs;
    if (!Array.isArray(dirs)) {
        dirs = [dirs];
    }

    const list = [];
    dirs.forEach((item) => {
        if (typeof item === 'string') {
            list.push({
                dir: item,
                type: ''
            });
            return;
        }

        if (item && typeof item === 'object') {
            for (const type in item) {
                list.push({
                    dir: item[type],
                    type: type
                });

            }
        }
    });

    const files = [];
    list.forEach((item) => {
        forEachSvg(item.dir, options.excludeSubDir, function(filePath) {
            files.push({
                filePath: filePath,
                type: item.type
            });
        });
    });

    return files;
};

//================================================================================================

const isExcludeFile = (ig, filePath) => {
    if (!ig) {
        return false;
    }
    if (ig.ignores(filePath) || ig.ignores(`${filePath}/`)) {
        return true;
    }
    return false;
};

const getIgnore = () => {
    let exclude = options.exclude || [];
    if (!Array.isArray(exclude)) {
        exclude = [exclude];
    }
    exclude = exclude.filter((item) => item);
    //console.log('exclude', exclude);
    if (!exclude.length) {
        return;
    }

    const ig = ignore();
    exclude.forEach((line) => {
        line = line.trim();
        if (line) {
            ig.add(line);
        }
    });
    return ig;
};

const generateSvgList = () => {

    const files = generateSvgFiles();
    log(`Found total svg files: ${files.length}`);

    const ig = getIgnore();

    const svgList = [];
    const ignoreList = [];
    files.forEach((item) => {

        const filePath = item.filePath;

        //exclude
        if (isExcludeFile(ig, filePath)) {
            ignoreList.push(item);
            return;
        }

        let name = path.basename(filePath, '.svg');

        //name check, name will be icon name
        if (typeof options.onSVGName === 'function') {
            name = options.onSVGName.call(options, name, item);
        }

        if (!name) {
            // should log onSVGName or onSVGNameDefault
            return;
        }

        //content
        const content = readFileContentSync(filePath);
        if (!content) {
            log(EC.red(`ERROR: Invalid svg file content: ${filePath}`));
            return;
        }

        svgList.push({
            filePath,
            name,
            content
        });
    });

    if (ignoreList.length) {
        log(`Ignored svg files: ${EC.yellow(ignoreList.length)}`);
    }

    //sort by name
    svgList.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
    });

    return svgList;

};

//================================================================================================

const duplicateNamesHandler = (duplicateMap, duplicateCount) => {

    if (!duplicateCount) {
        return;
    }
    log(`Found duplicate file name(s): ${EC.red(duplicateCount)}`);

    options.duplicateNames = duplicateMap;

    if (!options.logDuplicates) {
        return;
    }

    const rows = [];
    duplicateMap.forEach((v, k) => {
        const row = {
            index: rows.length + 1,
            name: `[${v.index}] ${v.filePath}`,
            subs: v.duplicates.map((it) => {
                return {
                    index: '',
                    name: ` ${EC.red('-')} ${it}`
                };
            })
        };
        rows.push(row);
    });
    CG({
        options: {
            silent: options.silent
        },
        columns: [{
            id: 'index',
            name: ''
        }, {
            id: 'name',
            name: `Keep the first one, others are ${EC.red('ignored')}`,
            maxWidth: 80
        }],
        rows
    });
};

const duplicateContentsHandler = (nameMap, icons) => {
    //replace duplicate content to index

    const contentMap = new Map();
    const duplicateMap = new Map();
    let duplicateCount = 0;

    icons.forEach(function(icon, i) {

        let filePath = icon.name;

        const nameInfo = nameMap.get(icon.name);
        if (nameInfo) {
            filePath = nameInfo.filePath;
        }

        const contentInfo = contentMap.get(icon.content);
        if (contentInfo) {
            icon.content = contentInfo.index;
            contentInfo.duplicates.push({
                index: i,
                filePath
            });
            duplicateMap.set(contentInfo.name, contentInfo);
            duplicateCount += 1;
            return;
        }
        contentMap.set(icon.content, {
            name: icon.name,
            index: i,
            filePath: filePath,
            duplicates: []
        });
    });


    if (!duplicateCount) {
        return;
    }
    log(`Found duplicate file content(s): ${EC.yellow(duplicateCount)}`);

    options.duplicateContents = duplicateMap;

    if (!options.logDuplicates) {
        return;
    }

    const rows = [];
    duplicateMap.forEach((v, k) => {
        const row = {
            index: rows.length + 1,
            name: `[${v.index}] ${v.filePath}`,
            subs: v.duplicates.map((it) => {
                return {
                    index: '',
                    name: ` ${EC.yellow('!')} [${it.index}] ${it.filePath}`
                };
            })
        };
        rows.push(row);
    });
    CG({
        options: {
            silent: options.silent
        },
        columns: [{
            id: 'index',
            name: ''
        }, {
            id: 'name',
            name: 'Keep one copy content',
            maxWidth: 80
        }],
        rows
    });
};

//================================================================================================

const getSvgAttrs = ($svg) => {

    const keys = [
        'style',
        'alignment-baseline',
        'baseline-shift',
        'clip',
        'clip-path',
        'clip-rule',
        'color',
        'color-interpolation',
        'color-interpolation-filters',
        'color-profile',
        'color-rendering',
        'cursor',
        'd',
        'direction',
        'display',
        'dominant-baseline',
        'enable-background',
        'fill',
        'fill-opacity',
        'fill-rule',
        'filter',
        'flood-color',
        'flood-opacity',
        'font-family',
        'font-size',
        'font-size-adjust',
        'font-stretch',
        'font-style',
        'font-variant',
        'font-weight',
        'glyph-orientation-horizontal',
        'glyph-orientation-vertical',
        'image-rendering',
        'kerning',
        'letter-spacing',
        'lighting-color',
        'marker-end',
        'marker-mid',
        'marker-start',
        'mask',
        'opacity',
        'overflow',
        'pointer-events',
        'shape-rendering',
        'solid-color',
        'solid-opacity',
        'stop-color',
        'stop-opacity',
        'stroke',
        'stroke-dasharray',
        'stroke-dashoffset',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-miterlimit',
        'stroke-opacity',
        'stroke-width',
        'text-anchor',
        'text-decoration',
        'text-rendering',
        'transform',
        'unicode-bidi',
        'vector-effect',
        'visibility',
        'word-spacing',
        'writing-mode'
    ];

    const attrs = $svg.attr();
    const list = [];
    Object.keys(attrs).forEach((key) => {
        if (keys.includes(key)) {
            list.push({
                key,
                value: attrs[key]
            });
        }
    });

    list.sort();

    return list;
};

// move svg attrs down to g
const svgAttrsHandler = ($svg, item) => {
    const list = getSvgAttrs($svg);
    if (!list.length) {
        return;
    }
    const content = $svg.html();

    const attrs = list.map((it) => {
        $svg.removeAttr(it.key);
        return `${it.key}="${it.value}"`;
    }).join(' ');

    const html = `<g ${attrs}>${content}</g>`;
    $svg.html(html);

    // if (item.name === '2fa-tabler') {
    //     console.log('attrs', attrs);
    //     console.log(content);
    //     console.log($svg.html());
    // }

};

//================================================================================================

const generateOptimizedContent = (content, item) => {
    const $ = cheerio.load(content, {
        xmlMode: true
    });

    const $svg = $('svg');

    //user handler after
    if (typeof options.onSVGOptimized === 'function') {
        options.onSVGOptimized.call(options, $svg, item, $);
    }

    return $svg.html();
};

const getOptimizedContent = (item, $) => {

    //svgo optimize
    const svgoConfig = {
        ... options.svgo,
        path: item.filePath
    };

    //$.html more safe (DOCTYPE removed, maybe invalid) than $.xml();
    const svg = $.html('svg');

    const result = optimize(svg, svgoConfig);
    if (!result.data) {

        if (typeof options.onSVGError === 'function') {
            return options.onSVGError.call(options, result, item, $);
        }

        return;
    }

    return generateOptimizedContent(result.data, item);
};

const getSvgViewBox = ($svg) => {
    const viewBox = $svg.attr('viewBox');
    if (viewBox) {
        return viewBox;
    }
    const width = $svg.attr('width');
    const height = $svg.attr('height');
    if (width && height) {
        return `0 0 ${width} ${height}`;
    }
};

const svgContentHandler = (item) => {
    if (typeof options.onSVGContent === 'function') {
        const newContent = options.onSVGContent.call(options, item.content, item);
        if (newContent) {
            item.content = newContent;
        }
    }
};

const svgDocumentHandler = ($svg, item, $) => {
    if (typeof options.onSVGDocument === 'function') {
        options.onSVGDocument.call(options, $svg, item, $);
    }
};

const generateSvgMetadata = (svgList) => {

    const icons = [];

    //no constructor in prototype if name is "constructor"

    const nameMap = new Map();
    const duplicateMap = new Map();
    let duplicateCount = 0;

    svgList.forEach((item) => {

        const name = item.name;
        const filePath = item.filePath;

        const nameInfo = nameMap.get(name);
        if (nameInfo) {
            nameInfo.duplicates.push(filePath);
            duplicateMap.set(name, nameInfo);
            duplicateCount += 1;
            return;
        }

        svgContentHandler(item);

        //==================================================================
        //some attrs will be removed from optimized svg include viewBox
        //generate info from original svg
        const $ = cheerio.load(item.content, {
            xmlMode: true
        });

        const $svg = $('svg');
        if (!$svg.length) {
            log(EC.red(`ERROR: Not found svg tag in file: ${filePath}`));
            return;
        }

        //user handler first
        svgDocumentHandler($svg, item, $);

        const viewBox = getSvgViewBox($svg);
        const preserveAspectRatio = $svg.attr('preserveAspectRatio');

        //before optimize
        svgAttrsHandler($svg, item);

        const content = getOptimizedContent(item, $);
        //allow empty like blank.svg
        if (typeof content !== 'string') {
            // should log onSVGError or onSVGErrorDefault
            return;
        }

        //==================================================================

        nameMap.set(name, {
            index: icons.length,
            filePath: filePath,
            duplicates: []
        });

        icons.push({
            name,
            viewBox,
            preserveAspectRatio,
            content
        });

    });

    duplicateNamesHandler(duplicateMap, duplicateCount);

    duplicateContentsHandler(nameMap, icons);

    if (icons.length) {
        log(`Converted svg files: ${EC.green(icons.length)}`);
    } else {
        log(EC.yellow('Nothing to convert'));
    }

    return Object.assign(options.metadata, {
        id: options.id,
        icons
    });

};

//================================================================================================

const saveMetadata = (outputDir, id, metadata) => {
    const jsonPath = path.resolve(outputDir, `${id}.json`);
    const jsonSaved = writeFileContentSync(jsonPath, JSON.stringify(metadata, null, 4));
    if (jsonSaved) {
        log(`Saved svg metadata json: ${EC.green(relativePath(jsonPath))}`);
    }
};

const saveRuntime = (outputDir, id, metadata) => {
    const compressedStr = compress(JSON.stringify(metadata));

    const libPath = path.resolve(outputDir, `${id}.js`);

    const content = URT({
        //umd name
        name: id,
        //runtime template name
        template: 'lz-decompress-svg',
        //replacement content
        content: compressedStr,
        //output file path
        output: libPath
    });

    if (content) {
        log(`Saved svg runtime lib: ${EC.green(relativePath(libPath))}`);
    }
};

const outputHandler = (metadata) => {

    const id = options.id;
    if (!id) {
        return;
    }

    const outputMetadata = options.outputMetadata;
    const outputRuntime = options.outputRuntime;
    if (!outputMetadata && !outputRuntime) {
        return;
    }

    const outputDir = path.resolve(options.outputDir);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
            recursive: true
        });
    }

    if (outputMetadata) {
        saveMetadata(outputDir, id, metadata);
    }

    if (outputRuntime) {
        saveRuntime(outputDir, id, metadata);
    }

};

//================================================================================================

module.exports = (_options) => {

    const defaults = defaultOptions();

    options = {
        ... defaults,
        ... defaultCallbacks,
        ... _options
    };

    if (_options.svgo) {
        options.svgo = {
            ... defaults.svgo,
            ... _options.svgo
        };
    }

    const svgList = generateSvgList();

    const metadata = generateSvgMetadata(svgList);

    outputHandler(metadata);

    if (typeof options.onFinish === 'function') {
        options.onFinish.call(options, options, metadata);
    }

    return metadata;
};
