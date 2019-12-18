module.exports = {
    roots: [
        "<rootDir>/src"
    ],
    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@api/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
        '^@admin/(.*)$': '<rootDir>/../shared-admin/src/$1',
    },
}