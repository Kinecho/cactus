module.exports = {
    roots: [
        "<rootDir>/src"
    ],

    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@admin/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/../src/$1',
    },
    // modulePathIgnorePatterns: [".db.test.ts"]
}