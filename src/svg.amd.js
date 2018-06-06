define(['exports', './vendor/snap.svg-0.5.1', 'snap-svg-plugin', 'store', 'helper-state-getComponent', './svg--get-attributes.es', './svg--update-weight.es'], function (exports, _snapSvg, _snapSvgPlugin, _store, _helperStateGetComponent, _svgGetAttributes, _svgUpdateWeight) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var moduleSnap = _interopRequireWildcard(_snapSvg);

    var plugin = _interopRequireWildcard(_snapSvgPlugin);

    var _store2 = _interopRequireDefault(_store);

    var _helperStateGetComponent2 = _interopRequireDefault(_helperStateGetComponent);

    var _svgGetAttributes2 = _interopRequireDefault(_svgGetAttributes);

    var _svgUpdateWeight2 = _interopRequireDefault(_svgUpdateWeight);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
            return obj;
        } else {
            var newObj = {};

            if (obj != null) {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                }
            }

            newObj.default = obj;
            return newObj;
        }
    }

    /*eslint-enable */

    var Snap = moduleSnap.default;

    /*eslint-disable */


    var converterEngine = function converterEngine(input) {
        // fn BLOB => Binary => Base64 ?
        var uInt8Array = new Uint8Array(input.response),
            i = uInt8Array.length;
        var biStr = []; //new Array(i);
        while (i--) {
            biStr[i] = String.fromCharCode(uInt8Array[i]);
        }
        var base64 = window.btoa(biStr.join(''));
        return [base64, input.getResponseHeader('content-type')];
    };

    var getImageBase64 = function getImageBase64(url, callback, scope) {
        // to comment better
        var xhr = new XMLHttpRequest(url),
            img64;
        xhr.open('GET', url, true); // url is the url of a PNG/JPG image.
        xhr.responseType = 'arraybuffer';
        xhr.callback = callback;
        xhr.onload = function () {
            img64 = converterEngine(this); // convert BLOB to base64
            this.callback.call(scope, null, img64); // callback : err, data
        };
        xhr.onerror = function () {
            callback('B64 ERROR', null);
        };
        xhr.send();
    };

    var onEmbeddedBitmapLoaded = function onEmbeddedBitmapLoaded(err) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        if (err) {
            console.error(err);
            return;
        }

        data[1] = data[1].indexOf('image/') ? 'image/png' : data[1];

        var s = Snap(this);

        if (s) {
            s.attr('xlink:href', 'data:' + data[1] + ';base64,' + data[0]);
            s.node.removeAttribute('data-svg-id');
        }
    };

    var setBackground = function setBackground(ID, source) {
        document.querySelectorAll('[data-bg-id=' + ID + ']').forEach(function (node) {
            node.style.backgroundImage = 'url("' + source + '")';
            node.removeAttribute("data-bg-id");
        });
    };

    var setSource = function setSource(sources, target) {
        var images = target && typeof target.selectAll === 'function' ? target.selectAll('[data-img-id]') : document.querySelectorAll('[data-img-id]'),
            len = images.length;

        for (var i = 0; i < len; i++) {
            var image = target ? images[i].node : images[i],
                ID = image.getAttribute('data-img-id'),
                src = ID && Array.isArray(sources) ? sources.filter(function (o) {
                return o.id === ID;
            }).reduce(function (res, o) {
                return o.source;
            }, '') : '';

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

    var setNodeText = function setNodeText(node) {
        var arr = (0, _helperStateGetComponent2.default)(_store2.default.getState(), 'svgwithtext');

        Snap(node).selectAll('[data-text-id]').forEach(function (text) {
            text.setText(window.viewModel, (0, _svgGetAttributes2.default)(text.attr('data-text-id'), arr));
        });
    };

    var setSvgTexts = function setSvgTexts(selector) {
        (0, _svgUpdateWeight2.default)(selector);

        document.querySelectorAll(selector).forEach(function (node) {
            setNodeText(node);
        });
    };

    var updateContentSVG = function updateContentSVG() {
        var par,
            parMor = 'meet',
            // mor = meet or slice
        parAlign = 'xMidYMid',
            // par = preserve aspect ratio`
        container = document.getElementById('content-figure-svg'),
            svg = container ? container.querySelector('svg') : null;

        if (!svg) {
            return;
        }

        var page = _store2.default.getState().entity || {};

        if (svg.hasAttribute('preserveAspectRatio')) {
            par = svg.getAttribute('preserveAspectRatio').split(' ');
            parAlign = par[0];
            parMor = par[1];
        }

        if (page.imageScaleSize === 'cover') {
            parMor = 'slice';
        }

        switch (page.imagePosition) {
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

    var onSVGLoaded = function onSVGLoaded(data, prop, resolve, pageID) {
        var page = _store2.default.getState().entity || {},
            str = typeof prop === 'string' ? true : false,
            s = str ? Snap('#' + prop) : Snap(prop);

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
    };

    var loadImage = function loadImage(source, type, ID) {
        if (source === '' || type !== 'image/svg+xml') {
            return new Promise(function (resolve) {
                resolve();
            });
        }

        return new Promise(function (resolve) {
            var app = _store2.default.getState().training || {},
                page = _store2.default.getState().entity || {},
                onLoaded = function onLoaded(data) {
                onSVGLoaded(data, ID, resolve, page.ID);
            };

            if (!app.svgsInIndexHtml) {
                Snap.load(source, onLoaded);
                return;
            }

            var name = source.split('/').pop().split('?').shift(),
                paper = Snap.parse(window.offlineSVGs[name]);

            if (paper) {
                onLoaded.call(undefined, paper);
                return;
            }

            resolve();
        });
    };

    var setImagesSource = function setImagesSource(images, target) {
        var res = [new Promise(function (resolve) {
            resolve();
        })];

        if (!images || !images.length) {
            return res;
        }

        setSource(images, target);

        if (target) {
            return res;
        }

        images.forEach(function (i) {
            var ID = i.id,
                source = i.source,
                node = document.getElementById(ID);

            if (node) {
                node.setAttribute('src', i.source);
            }

            setBackground(ID, source);

            document.querySelectorAll('[data-svg-id="' + ID + '"]:not([data-img-loading])').forEach(function (node) {
                node.setAttribute('data-img-loading', 'true');

                res.push(new Promise(function (resolve) {
                    var app = _store2.default.getState().training || {},
                        page = _store2.default.getState().entity || {},
                        onLoaded = function onLoaded(data) {
                        onSVGLoaded(data, node, resolve, page.ID);
                    };

                    if (!app.svgsInIndexHtml) {
                        Snap.load(source, onLoaded, node);
                        return;
                    }

                    var name = source.split('/').pop().split('?').shift(),
                        paper = Snap.parse(window.offlineSVGs[name]);

                    if (paper) {
                        onLoaded.call(node, paper);
                        return;
                    }

                    resolve();
                }));
            });
        });

        return res;
    };

    exports.default = {
        loadImage: loadImage,
        setImagesSource: setImagesSource,
        setSvgTexts: setSvgTexts,
        updateContentSVG: updateContentSVG
    };
});