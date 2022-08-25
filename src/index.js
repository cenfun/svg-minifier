import decompress from 'lz-utils/lib/decompress.js';

const getSvg = (item) => {
    const list = ['<svg'];
    if (item.viewBox) {
        list.push(` viewBox="${item.viewBox}"`);
    }
    list.push(' width="100%" height="100%"');
    if (item.preserveAspectRatio) {
        list.push(` preserveAspectRatio="${item.preserveAspectRatio}"`);
    }
    list.push(' pointer-events="none" xmlns="http://www.w3.org/2000/svg">');
    list.push(item.content);
    list.push('</svg>');
    return list.join('');
};

const metadataStr = decompress('{placeholder_compressed_metadata}');
const metadata = JSON.parse(metadataStr);

const contents = metadata.contents;
delete metadata.contents;

metadata.icons.forEach(function(icon) {
    icon.namespace = `${metadata.namespace}-${icon.name}`;
    //content for symbol later, no need delete
    icon.content = contents[icon.content];
    icon.svg = getSvg(icon);
});

const getAttrs = function(attrs) {
    if (!attrs) {
        return '';
    }
    return Object.keys(attrs).map(function(k) {
        const v = attrs[k];
        if (!v) {
            return '';
        }
        return `${k}="${v}"`;
    }).filter((it) => it).join(' ');
};

const getSvgSymbol = function(inlineSvg) {

    const ls = [];
    if (!inlineSvg) {
        ls.push('<?xml version="1.0" encoding="UTF-8"?>');
        ls.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">');
    }

    ls.push('<svg xmlns="http://www.w3.org/2000/svg">');
    metadata.icons.forEach(function(icon) {
        const attrs = {
            id: icon.namespace,
            viewBox: icon.viewBox,
            preserveAspectRatio: icon.preserveAspectRatio
        };
        const symbolAttrs = getAttrs(attrs);
        ls.push(`<symbol ${symbolAttrs}>`);
        ls.push(icon.content);
        ls.push('</symbol>');
    });

    ls.push('</svg>');

    return ls.join('');
};

export {
    metadata,
    getSvg,
    getSvgSymbol
};

export default metadata;

