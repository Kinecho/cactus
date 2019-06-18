module.exports = {
    roots: [
        "<rootDir>/src"
    ],
    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@scripts/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
        '^@api/(.*)$': '<rootDir>/../functions/src/$1',
        '^@web/(.*)$': '<rootDir>/../web/src/$1',

    }
}