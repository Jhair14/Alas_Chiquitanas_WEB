const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './', // raíz del proyecto
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};

module.exports = createJestConfig(customJestConfig);
