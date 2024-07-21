module.exports = {
    maxWorkers: 1,
    testTimeout: 120000,
    testRegex: '\\.e2e\\.js$',
    reporters: ['detox/runners/jest/reporter'],
    verbose: true,
    globalSetup: 'detox/runners/jest/globalSetup',
    globalTeardown: 'detox/runners/jest/globalTeardown',
    testEnvironment: 'detox/runners/jest/testEnvironment',
};
