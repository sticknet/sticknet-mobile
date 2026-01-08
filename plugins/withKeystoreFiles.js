const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

module.exports = function withCopyKeystore(config) {
    return withDangerousMod(config, [
        'android',
        async (c) => {
            const projectRoot = c.modRequest.projectRoot;
            const keystoreDir = path.join(projectRoot, 'keystore');
            const srcProps = path.join(keystoreDir, 'keystore.properties');
            const destProps = path.join(projectRoot, 'android', 'keystore.properties');
            const srcKeystore = path.join(keystoreDir, 'upload-key-store.keystore');
            const destKeystore = path.join(projectRoot, 'android', 'app', 'upload-key-store.keystore');

            copyFile(srcProps, destProps);
            copyFile(srcKeystore, destKeystore);

            return c;
        },
    ]);
};
