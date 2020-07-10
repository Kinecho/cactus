const {compilerOptions} = require('./tsconfig')
const {pathsToModuleNameMapper} = require('ts-jest/utils')

module.exports = {
    roots: [
        "<rootDir>/src"
    ],

    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    // moduleNameMapper: {
    //     '^@shared/(.*)$': '<rootDir>/src/$1',
    // },
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'}),
    // modulePathIgnorePatterns: [".db.test.ts"]
}