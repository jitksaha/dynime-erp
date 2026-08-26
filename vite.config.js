import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'node:path';
import fs from 'node:fs';

const packagesDir = resolve(__dirname, 'packages/workdo');
const workdoPackages = fs.existsSync(packagesDir)
    ? fs.readdirSync(packagesDir)
        .map(pkg => `packages/workdo/${pkg}/src/Resources/js/app.tsx`)
        .filter(p => fs.existsSync(resolve(__dirname, p)))
    : [];

export default defineConfig({
    base: './',
    plugins: [
        laravel({
            input:
                [
                    'resources/css/app.css',
                    'resources/js/app.tsx',
                    ...workdoPackages
                ],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: 'localhost',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
        watch: {
            ignored: ['**/vendor/**', '**/node_modules/**']
        },
        fs: {
            allow: ['..', 'packages']
        }
    },

    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                    utils: ['date-fns', 'clsx']
                }
            },
        },
        assetsDir: 'assets',
    }
});
