# 🔑 如何生成 GitHub Token（令牌）- 详细步骤

## 第一步：打开浏览器，访问 GitHub

1. 打开你的浏览器（Safari、Chrome 都可以）
2. 在地址栏输入这个网址：
   ```
   https://github.com/settings/tokens
   ```
3. 按回车键打开

## 第二步：登录 GitHub

1. 如果还没登录，会要求你登录
2. 输入你的 GitHub 用户名和密码登录

## 第三步：生成新的 Token

1. 登录后，你会看到一个页面，标题是 "Personal access tokens"
2. 点击页面上的 **"Generate new token"**（生成新令牌）按钮
3. 如果看到两个选项，选择 **"Generate new token (classic)"**（生成经典令牌）

## 第四步：设置 Token

1. **Note（备注）**：输入 `resume_editor`（随便起个名字，方便记住）
2. **Expiration（过期时间）**：选择 `90 days`（90天）或 `No expiration`（永不过期）
3. **Select scopes（选择权限）**：找到并勾选 **`repo`** 这一项
   - 这会自动勾选下面所有的小选项，不用管
4. 滚动到页面最下面
5. 点击绿色的 **"Generate token"**（生成令牌）按钮

## 第五步：复制 Token

1. 页面会显示一个很长的字符串（类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
2. **重要**：这个 Token 只显示一次，一定要立即复制！
3. 选中整个 Token 字符串，按 `Command+C` 复制
4. 把 Token 粘贴到一个安全的地方（比如记事本），保存好

## 第六步：使用 Token 推送代码

回到终端，重新执行推送命令：

1. 在终端输入：
   ```
   git push origin main
   ```
2. 按回车
3. 当要求输入 **Username（用户名）** 时，输入：`q755015108`
4. 当要求输入 **Password（密码）** 时：
   - **不要输入你的 GitHub 密码**
   - 而是粘贴刚才复制的 Token（按 `Command+V`）
   - 注意：粘贴时屏幕上不会显示任何字符（这是正常的，为了安全）
5. 粘贴完 Token 后，按回车键

## 如果还是不行

如果遇到问题，可以尝试这个方法：

1. 在终端输入：
   ```
   git remote set-url origin https://q755015108:你的Token@github.com/q755015108/resume_editor.git
   ```
   （把"你的Token"替换成刚才复制的 Token）

2. 然后再执行：
   ```
   git push origin main
   ```

## 需要帮助？

如果哪一步不清楚，请告诉我：
- 你在哪一步卡住了
- 屏幕上显示了什么
- 你看到了什么错误信息

