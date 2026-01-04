export default function snakeize(obj: any): any {
    if (!obj) return obj;
    if (typeof obj === 'string') return snakeCase(obj);
    if (obj._parts) {
        // FormData
        obj._parts = obj._parts.map((item: any) => [snakeCase(item[0]), item[1]]);
        return obj;
    }
    return walk(obj);
}

function walk(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (Array.isArray(obj)) return obj.map(walk);
    return Object.keys(obj).reduce((acc: any, key: string) => {
        const snake = snakeCase(key);
        acc[snake] = walk(obj[key]);
        return acc;
    }, {});
}

function snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

const isDate = (obj: any): boolean => {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

const isRegex = (obj: any): boolean => {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};
