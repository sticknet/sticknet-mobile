export default function camelize(obj: any): any {
    if (typeof obj === 'string') return camelCase(obj);
    return walk(obj);
}

function walk(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (isArray(obj)) return map(obj, walk);
    return reduce(
        Object.keys(obj),
        function (acc, key) {
            const camel = camelCase(key);
            acc[camel] = walk(obj[key]);
            return acc;
        },
        {},
    );
}

function camelCase(str: string): string {
    return str.replace(/[_](\w|$)/g, function (_, x) {
        return x.toUpperCase();
    });
}

const isArray =
    Array.isArray ||
    function (obj: any): boolean {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

const isDate = function (obj: any): boolean {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

const isRegex = function (obj: any): boolean {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

function map(xs: any[], f: (item: any, index: number) => any): any[] {
    if (xs.map) return xs.map(f);
    const res = [];
    for (let i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
    }
    return res;
}

function reduce(xs: any[], f: (acc: any, item: any, index: number) => any, acc: any): any {
    if (xs.reduce) return xs.reduce(f, acc);
    for (let i = 0; i < xs.length; i++) {
        acc = f(acc, xs[i], i);
    }
    return acc;
}
