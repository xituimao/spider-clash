# Spider Clash 🕸️

一个轻量级的 Node.js 爬虫，用于抓取、验证和生成 Clash/V2Ray 订阅链接。

## 特性

- ✅ **多源抓取**: 支持从订阅链接或网页中提取节点。
- ✅ **自动验证**: 内置 TCP Ping 验证，自动剔除无效节点。
- ✅ **GitHub Actions**: 利用免费算力自动更新节点，生成永久订阅连接。
- ✅ **Clash/V2Ray**: 自动生成标准的 YAML 和 Base64 格式配置。

## 如何使用 (GitHub Actions 版) - **推荐**

这是最简单、最稳定的使用方式，无需自己的服务器。

### 1. Fork 本项目
点击右上角的 **Fork** 按钮，将项目复制到你的账号下。

### 2. 配置订阅源
修改 `src/config.js` 文件，填入你的订阅源 URL：
```javascript
export default {
    sources: [
        'https://你的订阅链接1...',
        'https://你的订阅链接2...'
    ],
    // ...
}
```

### 3. 启用权限 (关键步骤！)
在你的 GitHub 仓库页面：
1. 点击 **Settings** > **Actions** > **General**
2. 滚动到底部 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 点击 Save

### 4. 启动运行
1. 点击 **Actions** 标签页。
2. 在左侧选择 **Update Subscription**。
3. 点击 **Run workflow** 手动触发一次。
4. 之后每天会自动运行两次（北京时间 8:00 和 20:00）。

### 5. 获取订阅链接
运行成功后，订阅文件会自动更新在 `output` 文件夹中。你可以使用 **jsDelivr CDN** 加速作为你的订阅地址：

- **Clash 订阅**: 
  `https://cdn.jsdelivr.net/gh/<你的用户名>/<仓库名>@main/output/clash.yaml`
  
- **V2Ray/通用订阅**:
  `https://cdn.jsdelivr.net/gh/<你的用户名>/<仓库名>@main/output/subscribe.txt`

---

## 本地开发

```bash
# 安装依赖
npm install

# 单次运行
npm run crawl

# 运行测试
npm test
```

## Linux 服务器部署 (自托管)

如果你拥有一台 Linux 服务器 (VPS)，可以让爬虫并在后台静默运行。

### 1. 环境准备
确保服务器已安装 Node.js 18+。
```bash
# 检查 node 版本
node -v
```

### 2. 部署代码
```bash
git clone https://github.com/你的用户名/spider-clash.git
cd spider-clash
npm install
```

### 3. 后台运行

#### 方式 A: 使用 PM2 (推荐)
PM2 是一个强大的进程管理器，支持开机自启和日志管理。

```bash
# 安装 PM2
npm install -g pm2

# 启动爬虫 (它会根据 config.js 的 Cron 设定自动工作)
pm2 start src/index.js --name spider-clash

# 保存当前进程列表 (用于开机自启)
pm2 save
pm2 startup
```

常用命令：
- 查看日志: `pm2 logs spider-clash`
- 停止服务: `pm2 stop spider-clash`
- 重启服务: `pm2 restart spider-clash`

#### 方式 B: 使用 nohup
```bash
nohup node src/index.js > app.log 2>&1 &
```

### 4. 获取订阅
部署在服务器上后，你需要配置 Nginx 或 Apache 将 `output` 目录暴露给公网，或者直接通过文件路径读取。

## 贡献
欢迎提交 Issue 或 PR 改进解析逻辑。
