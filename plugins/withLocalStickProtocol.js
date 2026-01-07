// const { withSettingsGradle } = require('@expo/config-plugins');
//
// module.exports = (config, options) => {
//     return withSettingsGradle(config, (config) => {
//         // Correct the path to point to the 'app' subdirectory
//         const localLibPath = '/dev/stick-protocol/android/app';
//
//         const inclusion = `
// include ':stick-protocol-lib'
// project(':stick-protocol-lib').projectDir = new File('${localLibPath}')
// `;
//         if (!config.modResults.contents.includes(':stick-protocol-lib')) {
//             config.modResults.contents += inclusion;
//         }
//         return config;
//     });
// };