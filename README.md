# 股镜

股票研究辅助 App 原型，包含行情监看、找股票、持仓、观察池、通知、用户画像、组合风险和后端任务检查。

## 本地开发

启动后端：

```bash
npm run backend
```

启动前端：

```bash
npm run dev
```

默认地址：

- 前端：http://localhost:5173
- 后端：http://localhost:8010
- 后端文档：http://localhost:8010/docs
- 隐私政策草案：http://localhost:5173/privacy.html

## 常用检查

```bash
npm run lint
npm run build
npm run backend:test
```

## 部署后端

后端已经准备了 Docker 部署配置：

- `Dockerfile`
- `.env.production.example`
- `render.yaml`
- `DEPLOYMENT.md`

部署到稳定 HTTPS 域名后，把 `.env.ios` 里的 `VITE_API_BASE_URL` 改成正式 API 地址，再重新同步 iOS：

```bash
npm run ios:sync
```

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## iOS 打包准备

项目已接入 Capacitor，iOS 工程位于 `ios/`。

首次配置 iOS API 地址：

```bash
cp .env.ios.example .env.ios
```

如果是真机测试，把 `.env.ios` 里的 `VITE_API_BASE_URL` 改成手机可以访问的 HTTPS API 地址。模拟器本地调试通常可以继续使用 `http://localhost:8010`。

当前这台 Mac 的局域网 IP 示例：

```bash
VITE_API_BASE_URL=http://10.85.68.192:8010
```

真机测试时，iPhone 和 Mac 需要在同一个 Wi-Fi 下，并保持后端运行：

```bash
npm run backend
```

同步 Web 产物到 iOS：

```bash
npm run ios:sync
```

打开 Xcode：

```bash
npm run ios:open
```

### 真机运行步骤

1. 打开 Xcode 后，在顶部设备选择处选择你的 iPhone。
2. 在左侧选择 `App` 项目，再选择 `App` target。
3. 进入 `Signing & Capabilities`。
4. 勾选 `Automatically manage signing`。
5. 在 `Team` 里选择你的 Apple ID 团队。
6. 如果 Bundle Identifier 冲突，把 `com.alexw.gujing` 改成你自己的唯一标识，例如 `com.alexw.gujing.dev`。
7. iPhone 首次运行时，需要在手机上点信任开发者证书。
8. 点击 Xcode 左上角运行按钮，把股镜安装到 iPhone。

当前工程已经设置为 iPhone-only。正式上架前还需要配置签名团队、Bundle Identifier、App 图标、后台通知能力，并把 `public/privacy.html` 部署成 App Store Connect 可填写的公开 URL。
