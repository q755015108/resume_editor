import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 只在文件存在时加载环境变量，避免权限错误
    let env: Record<string, string> = {};
    try {
        env = loadEnv(mode, process.cwd(), '');
    } catch (error) {
        // 如果加载失败（如文件不存在），使用空对象
        // 静默失败，不影响构建
    }
    // Vercel 部署时不需要 base 路径，GitHub Pages 需要
    const base = process.env.VERCEL ? '/' : '/resume_editor/';
    // 优先使用 Vercel 的环境变量，如果没有则使用 .env 文件
    // 默认使用 yunwu.ai 的 API Key
    const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'sk-JKj8yYYz1tXcUdug3Tn1ubd1esBwKaLmNMMdBHZT7Y4MCwP8';
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
