# 部署指南

本文档介绍如何将"简历佳"部署到各种平台。

## 📋 部署前准备

1. 确保项目可以正常构建：
   ```bash
   npm run build
   ```

2. 检查构建产物：
   ```bash
   npm run preview
   ```

## 🌐 GitHub Pages

### 方法一：使用 GitHub Actions（推荐）

1. **配置仓库设置**
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

2. **更新 vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // 替换为你的仓库名
     // ... 其他配置
   })
   ```

4. **推送代码**
   ```bash
   git push origin main
   ```

5. GitHub Actions 会自动构建并部署

### 方法二：手动部署

1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **更新 vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... 其他配置
   })
   ```

3. **部署**
   ```bash
   npm run deploy
   ```

## 🚀 Vercel

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```

4. **自动部署**
   - 连接 GitHub 仓库后，每次 push 都会自动部署

## 📦 Netlify

1. **通过 Netlify Dashboard**
   - 访问 [Netlify](https://www.netlify.com/)
   - 点击 "Add new site" → "Import an existing project"
   - 连接你的 GitHub 仓库
   - 构建设置：
     - Build command: `npm run build`
     - Publish directory: `dist`

2. **通过 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

## ⚠️ 注意事项

1. **构建配置**
   - 确保 `vite.config.ts` 中的 `base` 路径正确
   - 如果部署到子路径，需要设置正确的 `base` 值

2. **性能优化**
   - 生产构建会自动优化代码
   - 建议启用 CDN 加速静态资源

## 🐛 常见问题

### 构建失败

- 检查 Node.js 版本（需要 16+）
- 检查依赖是否正确安装
- 查看构建日志中的错误信息

### 页面空白

- 检查 `base` 路径配置是否正确
- 检查浏览器控制台的错误信息
- 确认静态资源路径正确


