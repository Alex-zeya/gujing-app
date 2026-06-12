# 股镜微信开放平台接入说明

更新日期：2026-06-12

## 当前策略

股镜首版登录入口以手机号验证码为主。微信登录作为后续增强入口，等待开放平台移动应用审核和参数配置完成后启用。Apple 登录能力保留，但当前默认不展示。

微信登录当前处于“开放平台移动应用审核 / 参数配置中”阶段。前后端已经预留：

- App 内微信登录按钮
- iOS 原生登录桥接状态检测
- 后端 `/api/auth/wechat/status`
- 后端 `/api/auth/wechat/login`
- Render 环境变量 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`

## 微信开放平台填写建议

| 字段 | 建议填写 |
| --- | --- |
| 移动应用名称 | 股镜 |
| 英文名称 | Gujing |
| 移动应用简介 | 股镜是一款面向个人投资者的 A 股研究辅助工具，帮助用户整理行情、K 线、观察池、持仓和组合风险提示。 |
| 英文简介 | Gujing helps individual investors organize A-share market data, watchlists, holdings, K-line charts, and portfolio risk insights. |
| 应用官网 | `https://gujing-api.onrender.com/support.html` |
| Bundle ID | `com.zeyawang.gujing` |
| Universal Links | `https://gujing-api.onrender.com/app/` |
| 应用类目 | 工具-信息查询 |
| 是否已上架 | 未上架任何应用市场 |

## 审核说明

可以在申请说明中使用：

```text
股镜用于个人股票研究和风险观察，不提供证券交易、不代客理财、不承诺收益。
微信登录仅用于账户创建和同步用户主动保存的持仓、观察池、提醒规则和风险偏好。
应用当前处于内测阶段，计划先完成 iOS TestFlight 和 App Store 审核。
```

## 需要上传的图片

仓库已准备微信审核流程截图，位置：

- `assets/wechat-review-flow/00-login-page.png`
- `assets/wechat-review-flow/01-home-market.png`
- `assets/wechat-review-flow/02-stock-search.png`
- `assets/wechat-review-flow/03-search-suggestions.png`
- `assets/wechat-review-flow/04-stock-kline-analysis.png`
- `assets/wechat-review-flow/05-portfolio.png`
- `assets/wechat-review-flow/06-watchlist-alerts.png`
- `assets/wechat-review-flow/07-watch-stock-kline-detail.png`

如果平台要求“应用运行流程图”，优先上传首页、找股票、K线分析、持仓、观察池这 5 张。

## Render 环境变量

微信审核通过并拿到参数后，在 Render `gujing-api` 服务里配置：

```text
WECHAT_APP_ID=你的微信移动应用 AppID
WECHAT_APP_SECRET=你的微信移动应用 AppSecret
```

保存后选择 `Save, rebuild, and deploy`。部署完成后检查：

```bash
npm run deploy:check -- https://gujing-api.onrender.com
```

或者直接访问：

```text
https://gujing-api.onrender.com/api/auth/wechat/status
```

返回 `configured: true` 才表示后端参数已生效。

## iOS 后续工作

审核通过后还需要在 Xcode 工程中接入微信 OpenSDK，并让 `GujingWechatLogin` 原生插件真正调用微信授权。当前前端按钮和后端换码已经保留，缺的是微信官方 SDK 的真机授权链路。
