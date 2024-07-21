process.env.TZ = 'UTC';
const config = {
    verbose: true,
    testPathIgnorePatterns: ['node_modules'],
    transformIgnorePatterns: [
        'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|@react-native-firebase)',
    ],
    preset: 'react-native',
    moduleNameMapper: {
        '.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
        '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/jest_setup/__mocks__/FileMock.js',
    },
    transform: {
        // '^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
        '\\.[jt]sx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        './jest_setup/jest.setup.js',
        './node_modules/react-native-gesture-handler/jestSetup.js',
        './jest_setup/__mocks__/StickProtocolModule.js',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    coverageDirectory: './coverage/',
    // collectCoverage: true,
};

module.exports = config;
