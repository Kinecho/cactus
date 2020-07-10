module.exports = {
    roots: [
        "<rootDir>/src"
    ],
    preset: "ts-jest",
    setupFilesAfterEnv: [
        '../jest.setup.env.ts'
    ],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@scripts/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
        '^@api/(.*)$': '<rootDir>/../functions/src/$1',
        '^@web/(.*)$': '<rootDir>/../web/src/$1',
        '^@web-root/(.*)$': '<rootDir>/../web/$1',

    },
}