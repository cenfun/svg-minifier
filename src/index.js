import decompress from 'lz-utils/lib/decompress.js';

const getSvg = function(icon, size = '100%') {

    //round
    // <svg pointer-events="none" width="100%" height="100%">
    //     <mask id="${fullId}-mask">
    //         <rect rx="${radius}" ry="${radius}" fill="#ffffff" x="0" y="0" width="100%" height="100%" />
    //     </mask>
    //     <g mask="url(#${fullId}-mask)">
    //         <rect rx="${radius}" ry="${radius}" fill="${color}" x="0" y="0" width="100%" height="100%" />
    //         <use xlink:href="#${fullId}" />
    //     </g>
    // </svg>

    const list = ['<svg'];
    if (icon.viewBox) {
        list.push(` viewBox="${icon.viewBox}"`);
        delete icon.viewBox;
    }
    list.push(` width="${size}" height="${size}"`);
    if (icon.preserveAspectRatio) {
        list.push(` preserveAspectRatio="${icon.preserveAspectRatio}"`);
        delete icon.preserveAspectRatio;
    }
    list.push(' pointer-events="none" xmlns="http://www.w3.org/2000/svg">');

    list.push(icon.content);
    delete icon.content;

    list.push('</svg>');
    return list.join('');
};

const metadataStr = decompress('{placeholder_compressed_metadata}');
const metadata = JSON.parse(metadataStr);

const icons = metadata.icons;

//repeated content handler
icons.forEach((icon) => {
    const namespace = `${metadata.namespace}-${icon.name}`;
    icon.namespace = namespace;
    //content and prefix handler
    let content = icon.content;
    if (typeof content === 'number') {
        content = icons[content].content;
    }
    icon.content = content.split('{prefix}').join(namespace);
});

//generating svg
icons.forEach(function(icon) {
    icon.svg = getSvg(icon);
});

export {
    metadata,
    decompress,
    getSvg
};

export default metadata;

