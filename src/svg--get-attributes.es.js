
export default (ID, arr) => {

    if (!ID || typeof ID !== 'string' || !Array.isArray(arr)) {
        return {};
    }

    return arr.reduce((res, prop) => {

        if (!prop.items || !Array.isArray(prop.items)) {
            return res;
        }

        const obj = prop.items.filter(item => item.id === ID).reduce((res, o) => {
            return Object.keys(o).filter((i) => {
                return (!!o[i] && i !== 'id' &&  i !== 'index') ? true : false;
            }).reduce((res, j) => Object.assign(res, {[j]: o[j]}), {})
        }, {})

        return (obj.weight === '700') ? Object.assign(res, obj, {weight: '600'}) : Object.assign(res, obj);
    }, {});
}
