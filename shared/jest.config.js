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
        '^@shared/(.*)$': '<rootDir>/src/$1',
    },
    modulePathIgnorePatterns: [".db.test.ts"],
    // reporters: ["default", "jest-junit"]
}