export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testMatch: [
        '**/?(*.)+(spec).[tj]s?(x)',
    ],
    extensionsToTreatAsEsm: ['.ts'],
    collectCoverage: false,
};
