import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        testTimeout: 20000,
        hookTimeout: 30000
    }
});