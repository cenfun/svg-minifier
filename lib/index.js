const fs = require('fs');
const path = require('path');
const EC = require('eight-colors');
const cheerio = require('cheerio');

const compress = require('lz-utils/lib/compress.js');
const { optimize } = require('svgo');
const ignore = require('ignore');

const defaultOptions = require('./options.js');

const hasOwn = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};

const formatPath = function(str) {
    if (str) {
        str = str.replace(/\\/g, '/');
    }
    return str;
};

const replace = function(str, obj, defaultValue) {
    str = `${str}`;
    if (!obj) {
        return str;
    }
    str = str.replace(/\{([^}{]+)\}/g, function(match, key) {
        if (!hasOwn(obj, key)) {
            if (typeof defaultValue !== 'undefined') {
                return defaultValue;
            }
            return match;
        }
        let val = obj[key];
        if (typeof val === 'function') {
            val = val(obj, key);
        }
        if (typeof val === 'undefined') {
            val = '';
        }
        return val;
    });
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

const generateSvgFiles = (options) => {
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

const isExcludeFile = (ig, filePath) => {
    if (!ig) {
        return false;
    }
    if (ig.ignores(filePath) || ig.ignores(`${filePath}/`)) {
        return true;
    }
    return false;
};

const getIgnore = (options) => {
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

const generateSvgList = (options) => {

    const files = generateSvgFiles(options);
    console.log(`[${options.namespace}] Found total svg files: ${files.length}`);

    const ig = getIgnore(options);

    const svgList = [];
    const ignoreList = [];
    files.forEach((item) => {
        const type = item.type;
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
            return;
        }

        //content
        const content = readFileContentSync(filePath);
        if (!content) {
            EC.logRed(`ERROR: Invalid svg file content: ${filePath}`);
            return;
        }

        svgList.push({
            filePath,
            type,
            name,
            content
        });
    });

    if (ignoreList.length) {
        console.log(`[${options.namespace}] Ignored svg files: ${EC.yellow(ignoreList.length)}`);
    }

    return svgList;

};


const getSvgAttrList = ($svg) => {

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
    const attrList = [];
    Object.keys(attrs).forEach((k) => {
        if (keys.includes(k)) {
            attrList.push(`${k}="${attrs[k]}"`);
        }
    });

    attrList.sort();

    return attrList;
};

const getOptimizedContent = (options, item, $) => {
    //svgo optimize
    const svgoConfig = {
        ... options.svgo,
        path: item.filePath
    };

    //html more safe (DOCTYPE removed, maybe invalid)
    const svg = $.html('svg');
    //const svg = $.xml();

    const result = optimize(svg, svgoConfig);
    if (!result.data) {
        return options.onSVGError(result, item, $);
    }
    const $$ = cheerio.load(result.data, {
        xmlMode: true
    });

    return $$('svg').html();
};

const generateSvgMetadata = (options, svgList) => {

    const icons = [];
    const contentSet = new Set();

    //no constructor in prototype if name is "constructor"
    const nameMap = Object.create(null);

    svgList.forEach((item) => {

        const name = item.name;
        if (nameMap[name]) {
            EC.logRed(`ERROR: Ignore file: ${item.filePath}, the same name already exists: ${nameMap[name]}`);
            return;
        }

        //==================================================================
        //some attrs will be removed from optimized svg include viewBox
        //generate info from original svg
        const $ = cheerio.load(item.content, {
            xmlMode: true
        });

        const $svg = $('svg');

        if (!$svg.length) {
            EC.logRed(`ERROR: Not found svg tag: ${item.filePath}`);
            return;
        }

        nameMap[name] = item.filePath;

        if (typeof options.onSVGDocument === 'function') {
            options.onSVGDocument.call(options, $svg, item, $);
        }

        const viewBox = $svg.attr('viewBox');
        const preserveAspectRatio = $svg.attr('preserveAspectRatio');
        const attrList = getSvgAttrList($svg);

        //console.log(attrList);

        let content = getOptimizedContent(options, item, $);
        //allow empty like blank.svg
        if (typeof content !== 'string') {
            EC.logRed(`ERROR: Not found svg content: ${item.filePath}`);
            return;
        }

        if (attrList.length && content) {
            content = `<g ${attrList.join(' ')}>${content}</g>`;
        }

        // if (!viewBox) {
        //     console.log(`before: ${name} no viewBox`);
        // }


        //==================================================================

        icons.push({
            name,
            viewBox,
            preserveAspectRatio,
            content
        });

        contentSet.add(content);

    });

    //repeated content handler
    const contents = Array.from(contentSet);
    icons.forEach(function(item) {
        item.content = contents.indexOf(item.content);
    });

    if (icons.length) {
        console.log(`[${options.namespace}] Converted svg files: ${EC.green(icons.length)}`);
    } else {
        EC.logRed('ERROR: Nothing to convert');
    }

    return Object.assign(options.metadata, {
        namespace: options.namespace,
        icons,
        contents
    });

};

const saveMetadata = (outputDir, namespace, metadata) => {
    const jsonPath = path.resolve(outputDir, `${namespace}.json`);
    const jsonSaved = writeFileContentSync(jsonPath, JSON.stringify(metadata, null, 4));
    if (jsonSaved) {
        EC.logGreen(`Saved svg metadata json: ${relativePath(jsonPath)}`);
    }
};

const saveRuntime = (outputDir, namespace, metadata) => {
    const compressedStr = compress(JSON.stringify(metadata));

    const libDist = readFileContentSync(path.resolve(__dirname, 'runtime/template.js'));

    const libStr = replace(libDist, {
        placeholder_runtime_namespace: namespace,
        placeholder_compressed_metadata: compressedStr
    });

    const libPath = path.resolve(outputDir, `${namespace}.js`);
    const libSaved = writeFileContentSync(libPath, libStr);
    if (libSaved) {
        EC.logGreen(`Saved svg runtime lib: ${relativePath(libPath)}`);
    }
};

const outputHandler = (options, metadata) => {

    const namespace = options.namespace;
    if (!namespace) {
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
        saveMetadata(outputDir, namespace, metadata);
    }

    if (outputRuntime) {
        saveRuntime(outputDir, namespace, metadata);
    }

};

module.exports = (_options) => {

    const options = {
        ... defaultOptions,
        ... _options
    };

    if (_options.svgo) {
        options.svgo = {
            ... defaultOptions.svgo,
            ... _options.svgo
        };
    }

    const svgList = generateSvgList(options);

    const metadata = generateSvgMetadata(options, svgList);

    outputHandler(options, metadata);

    return metadata;
};
