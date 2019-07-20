module.exports = {
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    modulePathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/public/"],
    moduleNameMapper: {
        '^@web/(.*)$': '<rootDir>/src/scripts/$1',
        '^@components/(.*)$': '<rootDir>/src/scripts/components/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    }
}