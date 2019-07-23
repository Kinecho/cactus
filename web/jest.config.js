const {compilerOptions} = require('./tsconfig')
const {pathsToModuleNameMapper} = require('ts-jest')

module.exports = {
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '.*\\.(vue)$': 'vue-jest',
    },
    globals: {
        'ts-jest': {
            diagnostics: true,
        },
    },
    setupFiles: [
        './src/test/jestsetup.ts',
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts,vue}',
    ],
    coverageReporters: [
        'text',
        'clover',
        'html',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleDirectories: [
        'src',
        'src/scripts',
        'node_modules',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue', 'node'],
    modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/public/'],

    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'}),
    reporters: ["default", "jest-junit"]
}