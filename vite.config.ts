import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Vercel 部署时不需要 base 路径，GitHub Pages 需要
    // 检查是否在 Vercel 环境（通过环境变量判断）
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const base = isVercel ? '/' : '/resume_editor/';
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
