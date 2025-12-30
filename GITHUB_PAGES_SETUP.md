# GitHub Pages 部署配置指南

## 📋 配置步骤

### 1. 在 GitHub 仓库中配置 Pages

1. 访问你的仓库：https://github.com/q755015108/resume_editor
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
   - 选择 **GitHub Actions**（不是 "Deploy from a branch"）
5. 保存设置

### 2. 推送代码触发部署

推送代码到 GitHub 后，GitHub Actions 会自动：
1. 构建项目
2. 部署到 GitHub Pages

```bash
git add .
git commit -m "配置 GitHub Pages 部署"
git push origin main
```

### 4. 查看部署状态

1. 在仓库页面，点击 **Actions**（操作）标签
2. 查看 "Deploy to GitHub Pages" 工作流的状态
3. 等待部署完成（通常需要 1-2 分钟）

### 5. 访问你的网站

部署完成后，你的网站将在以下地址可用：

**https://q755015108.github.io/resume_editor**

> ⚠️ **注意**：首次部署可能需要几分钟时间。如果访问时显示 404，请等待几分钟后重试。

## 🔄 自动部署

配置完成后，每次你推送代码到 `main` 分支时，GitHub Actions 都会自动：
- 构建项目
- 部署到 GitHub Pages

## 🐛 故障排除

### 部署失败

1. 检查 **Actions** 标签中的错误信息
2. 检查构建日志中的错误

### 页面显示 404

1. 确认 `vite.config.ts` 中的 `base` 路径正确（`/resume_editor/`）
2. 等待几分钟后重试（首次部署需要时间）
3. 检查 GitHub Pages 设置中 Source 是否选择了 "GitHub Actions"

## 📝 更新网站

每次更新代码后，只需：

```bash
git add .
git commit -m "更新内容"
git push origin main
```

GitHub Actions 会自动重新部署网站。

