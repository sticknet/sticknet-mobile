const {withPodfile} = require('@expo/config-plugins');

module.exports = (config) => {
    return withPodfile(config, (config) => {
        // These are the lines that get lost during --clean
        const gitPods = `
  pod 'YapDatabase/SQLCipher', :git => 'https://github.com/signalapp/YapDatabase.git', branch: 'signal-release', :modular_headers => true
  pod 'GRKOpenSSLFramework', :git => 'https://github.com/signalapp/GRKOpenSSLFramework', :branch => 'mkirk/1.0.2t'
    `;

        // Inject them into the regenerated Podfile
        if (!config.modResults.contents.includes('YapDatabase/SQLCipher')) {
            config.modResults.contents = config.modResults.contents.replace(
                /use_expo_modules!/g,
                `use_expo_modules!\n${gitPods}`,
            );
        }

        return config;
    });
};
