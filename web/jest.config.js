const {compilerOptions} = require('./tsconfig')
const {pathsToModuleNameMapper} = require('ts-jest/utils')

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
        "jest-localstorage-mock"
    ],
    setupFilesAfterEnv: [
        '../jest.setup.env.ts'
    ],
    // collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts,vue}',
    ],
    coverageReporters: [
        'text',
        'clover',
        'html',
    ],

    coverageDirectory: "reports/coverage",
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleDirectories: [
        'src',
        'src/scripts',
        'src/test',
        'node_modules',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue', 'node'],
    modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/public/'],

    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'}),
    // reporters: ["default", "jest-junit"]
}