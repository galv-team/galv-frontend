module.exports = {
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
                    },
                },
            },
        ],
    },
    moduleNameMapper: {
        axios: 'axios/dist/node/axios.cjs',
    },
    transformIgnorePatterns: [
        "node_modules/(?!(array-move))/",
    ],
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js']
};