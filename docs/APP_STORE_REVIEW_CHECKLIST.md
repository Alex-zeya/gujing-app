# 股镜 App Store 审核检查清单

更新日期：2026-06-12

## 当前定位

股镜是股票研究辅助和风险观察工具，只整理 A 股行情、持仓、观察池、组合风险和研究线索，不提供证券投资咨询服务，不承诺收益，也不替用户做买卖决定。

## 审核前必须确认

- App 名称：股镜
- Bundle Identifier：`com.zeyawang.gujing`
- 版本：`1.0`
- 支持设备：iPhone only
- 隐私政策网页：`/privacy.html`，上线时需要替换成公开 HTTPS URL
- 支持中心网页：`/support.html`，上线时需要替换成公开 HTTPS URL
- 后端 API：上线时使用 HTTPS 公开域名，不能依赖 `localhost` 或局域网地址
- 测试方式：首版优先使用 Apple 登录；微信登录需要说明开放平台配置状态
- 上线准备度：App 内“我的 > 运行监控”需要显示关键门槛已通过或只剩非阻塞项

## 登录和账号

- Apple 登录已接入后端验签和 iOS 原生桥接；上线前必须在 Apple Developer 和 Xcode target 开启 `Sign in with Apple`。
- 微信登录按钮已保留，并已接入后端换码接口和 iOS 状态检测；正式可用前需要完成微信开放平台移动应用配置和 iOS OpenSDK 接入。
- 手机号验证码仅作为后续备用能力，首版 App 不展示手机号登录入口。
- “我的”页底部已提供“删除账户 / 清除数据”，删除用户资料、持仓、观察池、提醒规则、建议历史和登录会话。

## 审核素材位置

- 微信开放平台填写说明：[docs/WECHAT_OPEN_PLATFORM.md](./WECHAT_OPEN_PLATFORM.md)
- 微信审核流程截图：`assets/wechat-review-flow/`
- GitHub 项目说明：[README.md](../README.md)
- 上线准备度说明：[docs/LAUNCH_READINESS.md](./LAUNCH_READINESS.md)
- QA 测试记录：[docs/QA_TEST_REPORT.md](./QA_TEST_REPORT.md)

## 隐私和数据

- iOS 隐私清单文件：`ios/App/App/PrivacyInfo.xcprivacy`
- 已声明的数据类型：
  - Apple 登录用户标识 / 微信 openid：用于登录和账户管理
  - 用户 ID：用于账户同步
  - 持仓和交易输入：用于持仓分析和风险观察
  - 产品交互：用于搜索历史、观察池、推荐反馈和功能优化
- 不声明跨 App/网站追踪。
- App 内提供隐私说明弹窗和完整隐私政策网页入口。

## 金融合规文案

所有前端和后端建议类文案要保持以下边界：

- 可以说：信息整理、风险观察、概率判断、持仓复盘、组合集中度、趋势推断。
- 避免说：保证上涨、稳赚、必买、必卖、直接投资建议。
- 必须保留：本工具仅做信息整理和风险观察，不构成证券投资建议。

## 网络和权限

- `Info.plist` 已移除任意网络加载，只保留 `NSAllowsLocalNetworking` 方便真机开发连接同 Wi-Fi 后端。
- 正式上线时 API 必须使用 HTTPS。
- 如果后续接系统通知，需要补通知权限说明和用户可关闭入口。

## App Store Connect 建议填写

Review Notes 建议包含：

```text
股镜是一款股票研究辅助和风险观察工具，不提供证券投资咨询服务，也不承诺收益。

测试方式：
1. 打开 App 后使用 Apple 登录。
2. 如果微信登录已经完成开放平台配置，也可用微信测试登录；否则微信按钮会提示仍在配置中。
3. 登录后可测试：首页行情概览、找股票、加入观察池、加入持仓、买入/卖出记录、组合风险、隐私政策和删除账户。

后端 API 为 HTTPS 服务，若免费实例冷启动，首次请求可能需要等待约 50 秒。
```

## 上架前剩余项

- 配置公开 HTTPS 隐私政策 URL。
- 在 Apple Developer 和 Xcode target 开启 Sign in with Apple，并完成真机登录回归。
- 如保留微信登录，完成微信开放平台移动应用审核。
- 确认行情数据源授权和稳定性，避免用未授权抓取作为生产核心数据。
- 在真机完成登录、搜索、持仓、观察池、删除账户和冷启动测试。
