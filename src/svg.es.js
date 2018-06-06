import * as moduleSnap from './vendor/snap.svg-0.5.1';

/*eslint-disable */
import * as plugin from 'snap-svg-plugin';
/*eslint-enable */

const Snap = moduleSnap.default;

import store from 'store';

import getComponent from 'helper-state-getComponent';

import getAttributes from './svg--get-attributes.es';

import updateWeight from './svg--update-weight.es';

const converterEngine = function (input) { // fn BLOB => Binary => Base64 ?
    var uInt8Array = new Uint8Array(input.response),
        i = uInt8Array.length;
    var biStr = []; //new Array(i);
    while (i--) { biStr[i] = String.fromCharCode(uInt8Array[i]);  }
    var base64 = window.btoa(biStr.join(''));
    return [base64, input.getResponseHeader('content-type')];
};

const getImageBase64 = function (url, callback, scope) {
    // to comment better
    var xhr = new XMLHttpRequest(url),
        img64;
    xhr.open('GET', url, true); // url is the url of a PNG/JPG image.
    xhr.responseType = 'arraybuffer';
    xhr.callback = callback;
    xhr.onload  = function(){
        img64 = converterEngine(this); // convert BLOB to base64
        this.callback.call(scope, null, img64) // callback : err, data
    };
    xhr.onerror = function(){ callback('B64 ERROR', null); };
    xhr.send();
};

const onEmbeddedBitmapLoaded = function (err, data = []) {
    if (err) {
        console.error(err);
        return;
    }

    data[1] = (data[1].indexOf('image/')) ? 'image/png' : data[1];

    const s = Snap(this);

    if (s) {
        s.attr('xlink:href', 'data:' + data[1] + ';base64,' + data[0]);
        s.node.removeAttribute('data-svg-id');
    }
};

const setBackground = (ID, source) => {
    document.querySelectorAll('[data-bg-id='+ ID +']').forEach((node) => {
        node.style.backgroundImage = 'url("' + source + '")';
        node.removeAttribute("data-bg-id");
    })
};

var setSource = function(sources, target) {
    const images = (target && (typeof target.selectAll === 'function')) ? target.selectAll('[data-img-id]') : document.querySelectorAll('[data-img-id]'),
          len = images.length;

    for (var i = 0; i < len; i++) {
        var image = (target) ? images[i].node: images[i],
            ID = image.getAttribute('data-img-id'),
            src = (ID && Array.isArray(sources)) ? sources.filter(o => o.id === ID).reduce((res, o) => { return o.source; }, '') : '';

        if (src) {
            if (image.nodeName == "image") {
                // This is not supported in IE9
                getImageBase64(src, onEmbeddedBitmapLoaded, images[i]);
            } else {
                image.setAttribute('src', src);
                image.removeAttribute('data-img-id');
            }
        }
    }
};

const setNodeText = function(node) {
    const arr = getComponent(store.getState(), 'svgwithtext');

    Snap(node).selectAll('[data-text-id]').forEach(function(text) {
        text.setText(window.viewModel, getAttributes(text.attr('data-text-id'), arr));
    })
}

const setSvgTexts = function(selector) {
    updateWeight(selector);

    document.querySelectorAll(selector).forEach(function(node) {
        setNodeText(node);
    })
};

const updateContentSVG = function() {
    var par,
        parMor = 'meet',            // mor = meet or slice
        parAlign = 'xMidYMid',      // par = preserve aspect ratio`
        container = document.getElementById('content-figure-svg'),
        svg = (container) ? container.querySelector('svg') : null;

    if (!svg) {
        return;
    }

    const page = store.getState().entity || {};

    if (svg.hasAttribute('preserveAspectRatio')) {
        par = svg.getAttribute('preserveAspectRatio').split(' ');
        parAlign = par[0];
        parMor = par[1];
    }

    if (page.imageScaleSize === 'cover') {
        parMor = 'slice';
    }

    switch(page.imagePosition) {
    case 1:
        parAlign = 'xMinYMin';
        break;
    case 2:
        parAlign = 'xMinYMid';
        break;
    case 3:
        parAlign = 'xMinYMax';
        break;
    case 4:
        parAlign = 'xMidYMin';
        break;
    case 6:
        parAlign = 'xMidYMax';
        break;
    case 7:
        parAlign = 'xMaxYMin';
        break;
    case 8:
        parAlign = 'xMaxYMid';
        break;
    case 9:
        parAlign = 'xMaxYMax';
        break;
    case 5:
    default:
        parAlign = 'xMidYMid';
        break;
    }

    svg.setAttribute('preserveAspectRatio', parAlign + ' ' + parMor);
};

const onSVGLoaded = function(data, prop, resolve, pageID) {
    var page = store.getState().entity || {},
        str = (typeof prop === 'string') ? true : false,
        s = (str) ? Snap('#'+ prop) : Snap(prop);

    if (!s || pageID !== page.ID) {
        resolve();
        return;
    }

    s.append(data);

    if (!str) {
        setNodeText(prop);

        s.node.removeAttribute('data-svg-id');
        s.node.removeAttribute('data-img-loading');
    }

    resolve();
}

const loadImage = (source, type, ID) => {
    if (source === '' || type !== 'image/svg+xml') {
        return new Promise((resolve) => { resolve() });
    }

    return new Promise((resolve) => {
        const app = store.getState().training || {},
              page = store.getState().entity || {},
              onLoaded = (data) => {
                  onSVGLoaded(data, ID, resolve, page.ID);
              }

        if (!app.svgsInIndexHtml) {
            Snap.load(source, onLoaded);
            return;
        }

        const name = source.split('/').pop().split('?').shift(),
              paper = Snap.parse(window.offlineSVGs[name]);

        if (paper) {
            onLoaded.call(this, paper);
            return;
        }

        resolve();
    })
};

const setImagesSource = function(images, target) {
    const res = [new Promise((resolve) => { resolve() })];

    if (!images || !images.length) {
        return res;
    }

    setSource(images, target);

    if (target) {
        return res;
    }

    images.forEach((i) => {
        const ID = i.id,
              source = i.source,
              node = document.getElementById(ID);

        if (node) {
            node.setAttribute('src', i.source);
        }

        setBackground(ID, source);

        document.querySelectorAll('[data-svg-id="'+ ID +'"]:not([data-img-loading])').forEach((node) => {
            node.setAttribute('data-img-loading', 'true');

            res.push(new Promise((resolve) => {
                const app = store.getState().training || {},
                      page = store.getState().entity || {},
                      onLoaded = (data) => {
                          onSVGLoaded(data, node, resolve, page.ID);
                      };

                if (!app.svgsInIndexHtml) {
                    Snap.load(source, onLoaded, node);
                    return;
                }

                const name = source.split('/').pop().split('?').shift(),
                      paper = Snap.parse(window.offlineSVGs[name]);

                if (paper) {
                    onLoaded.call(node, paper);
                    return;
                }

                resolve();
            }))
        })
    })

    return res;
}

export default {
    loadImage: loadImage,
    setImagesSource: setImagesSource,
    setSvgTexts: setSvgTexts,
    updateContentSVG: updateContentSVG
}
