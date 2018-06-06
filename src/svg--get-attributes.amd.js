define(['exports'], function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }

        return obj;
    }

    exports.default = function (ID, arr) {

        if (!ID || typeof ID !== 'string' || !Array.isArray(arr)) {
            return {};
        }

        return arr.reduce(function (res, prop) {

            if (!prop.items || !Array.isArray(prop.items)) {
                return res;
            }

            var obj = prop.items.filter(function (item) {
                return item.id === ID;
            }).reduce(function (res, o) {
                return Object.keys(o).filter(function (i) {
                    return !!o[i] && i !== 'id' && i !== 'index' ? true : false;
                }).reduce(function (res, j) {
                    return Object.assign(res, _defineProperty({}, j, o[j]));
                }, {});
            }, {});

            return obj.weight === '700' ? Object.assign(res, obj, { weight: '600' }) : Object.assign(res, obj);
        }, {});
    };
});