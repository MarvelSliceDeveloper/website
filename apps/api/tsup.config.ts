import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    skipNodeModulesBundle: true,
    noExternal: ['@lms/types', '@lms/config', '@lms/utils'], // ← bundle workspace packages
});