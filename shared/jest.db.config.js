module.exports = {
    roots: [
        "<rootDir>/src"
    ],

    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/$1',
    },
    // modulePathIgnorePatterns: [".db.test.ts"]
}