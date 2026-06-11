# 股镜部署说明

当前真机调试使用临时隧道，正式测试应换成稳定 HTTPS 后端域名。后端已经支持 Docker 部署，适合 Render、Railway、Fly.io 或其他容器平台。

## 推荐路径

第一阶段建议先部署后端 API：

1. 把代码推到 GitHub。
2. 在 Render、Railway 或 Fly.io 创建 Web Service。
3. 使用仓库根目录的 `Dockerfile` 构建。
4. 设置环境变量，参考 `.env.production.example`。
5. 部署成功后打开 `https://你的域名/api/health`，应返回 `{"status":"ok","service":"gujing-api"}`。
6. 把 `.env.ios` 里的 `VITE_API_BASE_URL` 改成新的 HTTPS API 域名。
7. 重新执行 `npm run ios:sync`，再用 Xcode 或命令行安装到 iPhone。

## 关键环境变量

- `APP_ENV=production`：生产模式，验证码不再默认使用 `123456`。
- `PORT`：云平台注入端口，Docker 启动命令会读取它。
- `CORS_ORIGINS`：允许访问后端的前端来源，用英文逗号分隔。
- `DATABASE_URL`：PostgreSQL 连接串。Render Blueprint 会自动从 `gujing-db` 注入；其他平台可使用 Neon、Supabase、RDS 等连接串。
- `GUJING_DB_PATH`：仅本地 SQLite 开发使用。线上不要依赖 Web 服务本地文件保存用户数据。
- `SMS_PROVIDER`：前期可以用 `mock` 测试，正式短信需要换成 `aliyun` 或 `tencent` 并配置对应密钥。
- `TUSHARE_TOKEN`：历史 K 线数据 token。
- `PRIVACY_POLICY_URL`：公开 HTTPS 隐私政策地址，App Store 审核需要。
- `APNS_KEY_ID` / `APNS_TEAM_ID` / `APNS_BUNDLE_ID`：如果首版要做 iOS 系统推送，需要配置 Apple Push Notification 服务。

## Render

仓库里已经提供 `render.yaml`，默认使用 Render Free Web Service，适合先把 iPhone 端连到稳定 HTTPS 后端。Render FastAPI 官方文档也支持直接创建 Web Service 并配置 Docker 构建。

注意：

- `render.yaml` 里当前 `SMS_PROVIDER=mock`，只适合测试。
- `render.yaml` 已配置 `gujing-db` PostgreSQL，并把连接串注入 `DATABASE_URL`。如果你在 Render 控制台看到 Blueprint 变更，需要点同步/重新部署。
- Render Free 服务空闲一段时间会休眠，第一次打开可能需要等待几十秒。
- Render 免费 PostgreSQL 适合测试，有期限和资源限制；正式上线前建议换成付费数据库或外部持久数据库。
- `CORS_ORIGINS` 需要在拿到正式前端域名后补上。
- 部署后先打开 `https://你的后端域名/api/system/readiness`，确认 `database.mode` 是 `postgres`，`missingTables` 为空。
- App 内“我的 > 运行监控”会展示上线准备度。若仍显示生产数据库、登录验证、隐私政策或 iOS 后端地址未完成，先补这些配置再提交审核。

也可以直接用命令检查：

```bash
npm run readiness -- https://你的后端域名
```

本地检查使用：

```bash
npm run readiness
```

## Railway / Fly.io

这两个平台都可以直接使用 Dockerfile：

- Railway：从 GitHub 仓库创建项目，选择 Dockerfile 部署，配置 Variables。
- Fly.io：使用 `fly launch` 检测 Dockerfile，然后配置 volume 保存 `/data/gujing.db`。

## 上线前必须替换

- 临时 `localtunnel` 地址。
- 开发模拟短信。
- 生产 CORS 域名。
- 免费测试数据库或临时本地文件路径。

正式进入公开测试前，建议完成一次线上 readiness、股票搜索、手机号登录、持仓写入和真机 App 连接测试。
