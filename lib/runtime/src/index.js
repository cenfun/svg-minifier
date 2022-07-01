
const decompress = require('lz-utils/lib/decompress.js');

const generateSvg = function(item) {
    const list = ['<svg pointer-events="none" width="100%" height="100%"'];
    if (item.viewBox) {
        list.push(` viewBox="${item.viewBox}"`);
    }
    if (item.preserveAspectRatio) {
        list.push(` preserveAspectRatio="${item.preserveAspectRatio}"`);
    }
    list.push(`>${item.content}</svg>`);
    return list.join('');
};

const init = function() {
    const metadataStr = decompress('{placeholder_compressed_metadata}');
    const metadata = JSON.parse(metadataStr);
    metadata.icons.forEach(function(item) {
        item.namespace = metadata.namespace;
        item.content = metadata.contents[item.content];
        item.svg = generateSvg(item);
    });
    return metadata;
};

module.exports = init();

