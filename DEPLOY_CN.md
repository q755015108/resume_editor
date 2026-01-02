# 🇨🇳 国内访问部署指南

由于 Vercel 和 GitHub Pages 在中国大陆访问可能不稳定，本文档介绍如何部署到国内可访问的平台。

## 🎯 推荐方案

### 方案 1：Gitee Pages（推荐，免费）

Gitee 是国内的代码托管平台，Pages 服务在国内访问速度快且稳定。

#### 步骤：

1. **注册 Gitee 账号**
   - 访问 https://gitee.com
   - 注册并登录

2. **导入 GitHub 仓库**
   - 在 Gitee 点击"+" → "导入仓库"
   - 输入 GitHub 仓库地址：`https://github.com/q755015108/resume_editor`
   - 点击"导入"

3. **配置 Gitee Pages**
   - 进入仓库 → 点击"服务" → "Gitee Pages"
   - 选择分支：`main`
   - 选择目录：`dist`（需要先构建）
   - 点击"启动"

4. **更新 vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/resume_editor/', // 你的仓库名
     // ... 其他配置
   })
   ```

5. **构建并部署**
   ```bash
   npm run build
   # 然后将 dist 目录推送到 Gitee
   ```

### 方案 2：Vercel（使用国内 CDN 加速）

如果继续使用 Vercel，可以配置国内 CDN 加速：

1. **使用 Cloudflare（免费）**
   - 注册 Cloudflare 账号
   - 添加你的域名
   - 配置 DNS，将域名指向 Vercel
   - Cloudflare 会自动提供 CDN 加速

2. **使用自定义域名**
   - 在 Vercel 项目设置中添加自定义域名
   - 使用国内域名服务商（如阿里云、腾讯云）的域名
   - 配置 DNS 解析

### 方案 3：Netlify（备选）

Netlify 在国内访问相对稳定一些：

1. 访问 https://www.netlify.com/
2. 导入 GitHub 仓库
3. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`

### 方案 4：国内云服务（最稳定）

#### 阿里云 OSS + CDN

1. **创建 OSS 存储桶**
   - 登录阿里云控制台
   - 创建 OSS 存储桶
   - 设置静态网站托管

2. **上传文件**
   ```bash
   npm run build
   # 使用阿里云 OSS 工具上传 dist 目录
   ```

3. **配置 CDN**
   - 绑定 CDN 域名
   - 配置 HTTPS
   - 国内访问速度会很快

#### 腾讯云 COS + CDN

类似阿里云，使用腾讯云的对象存储和 CDN 服务。

#### 七牛云（推荐，有免费额度）

1. 注册七牛云账号
2. 创建对象存储空间
3. 配置静态网站托管
4. 上传 dist 目录
5. 绑定 CDN 域名

## 📊 各方案对比

| 方案 | 费用 | 国内访问速度 | 配置难度 | 推荐度 |
|------|------|------------|---------|--------|
| Gitee Pages | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 七牛云 | 免费（有额度） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 阿里云 OSS+CDN | 付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Netlify | 免费 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Vercel + CDN | 免费 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

## 🚀 快速开始（Gitee Pages）

### 1. 导入仓库到 Gitee

```bash
# 在 Gitee 网页上操作，或使用命令行：
git remote add gitee https://gitee.com/your-username/resume_editor.git
git push gitee main
```

### 2. 配置 GitHub Actions 自动部署到 Gitee

创建 `.github/workflows/deploy-gitee.yml`：

```yaml
name: Deploy to Gitee Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Gitee
        uses: yanglbme/gitee-pages-action@main
        with:
          gitee-username: your-username
          gitee-password: ${{ secrets.GITEE_PASSWORD }}
          gitee-repo: resume_editor
          branch: main
          directory: dist
```

### 3. 配置 Gitee Token

在 GitHub Secrets 中添加 `GITEE_PASSWORD`（你的 Gitee 密码或 Token）

## 💡 建议

**最推荐使用 Gitee Pages**：
- ✅ 完全免费
- ✅ 国内访问速度快
- ✅ 配置简单
- ✅ 支持自动部署

只需要将代码同步到 Gitee，然后启用 Pages 服务即可。

