module.exports = {
    roots: [
        "<rootDir>/src"
    ],
    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
        '^@admin/(.*)$': '<rootDir>/src/$1',
    },
    modulePathIgnorePatterns: [".db.test.ts"],
}