const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.statSync(s);
        if (stat.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

module.exports = function withCopyFonts(config) {
    return withDangerousMod(config, [
        'android',
        async (c) => {
            const projectRoot = c.modRequest.projectRoot;
            const src = path.join(projectRoot, 'assets', 'fonts');
            const dest = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'fonts');
            copyDir(src, dest);
            return c;
        },
    ]);
};
