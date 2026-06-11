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
- `GUJING_DB_PATH`：SQLite 数据库路径。免费测试部署可以不填；如果之后要长期保存真实用户数据，应改用 Postgres 或付费持久化磁盘。
- `SMS_PROVIDER`：前期可以用 `mock` 测试，正式短信需要换成 `aliyun` 或 `tencent` 并配置对应密钥。
- `TUSHARE_TOKEN`：历史 K 线数据 token。

## Render

仓库里已经提供 `render.yaml`，默认使用 Render Free Web Service，适合先把 iPhone 端连到稳定 HTTPS 后端。Render FastAPI 官方文档也支持直接创建 Web Service 并配置 Docker 构建。

注意：

- `render.yaml` 里当前 `SMS_PROVIDER=mock`，只适合测试。
- Render Free 服务空闲一段时间会休眠，第一次打开可能需要等待几十秒；免费文件系统也不会长期保存本地 SQLite 数据。
- `CORS_ORIGINS` 需要在拿到正式前端域名后补上。
- SQLite 必须挂载持久化磁盘，否则服务重建后数据会丢。

## Railway / Fly.io

这两个平台都可以直接使用 Dockerfile：

- Railway：从 GitHub 仓库创建项目，选择 Dockerfile 部署，配置 Variables。
- Fly.io：使用 `fly launch` 检测 Dockerfile，然后配置 volume 保存 `/data/gujing.db`。

## 上线前必须替换

- 临时 `localtunnel` 地址。
- 开发模拟短信。
- 生产 CORS 域名。
- SQLite 的临时本地文件路径。

正式进入公开测试前，建议把数据库从 SQLite 迁到 PostgreSQL，避免多实例和持久化限制带来的数据风险。
