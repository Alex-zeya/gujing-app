# 股镜 Logo 和素材替换说明

更新日期：2026-06-14

## 结论

股镜现在仍然可以换 Logo。正式上架 App Store 前替换成本最低；如果已经提交过微信开放平台或 App Store 审核，换 Logo 后需要同步更新平台素材，部分平台可能重新审核。

## 现有素材位置

| 用途 | 文件 |
| --- | --- |
| Logo 源文件 | `assets/brand/gujing-app-icon.svg` |
| 启动页源文件 | `assets/brand/gujing-splash.svg` |
| Web favicon | `public/favicon.svg` |
| iOS / Web 触摸图标 | `public/apple-touch-icon.svg` |
| iOS App 图标 | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` |
| iOS 启动图 | `ios/App/App/Assets.xcassets/Splash.imageset/` |
| 微信开放平台图标 | `assets/brand/wechat/` |
| 微信审核流程截图 | `assets/wechat-review-flow/` |

## 替换原则

- Logo 要和“股票研究辅助、K线、放大镜、风险观察”相关，但不要像证券公司或交易所官方标识。
- 保持简洁，108 x 108、1024 x 1024、手机小尺寸都要能看清。
- 不使用“稳赚”“荐股”“必涨”等容易引发合规风险的视觉语言。
- iOS AppIcon 不要透明背景，建议深色底或纯色底。
- 微信开放平台要求图标和应用市场图标一致，所以改一次要全平台同步。

## 推荐替换流程

1. 先定最终 Logo 方向。
2. 生成或绘制 1024 x 1024 PNG。
3. 同步生成：
   - 108 x 108 微信高清图
   - 28 x 28 微信小图
   - Web favicon / apple-touch-icon
   - iOS AppIcon
   - 启动页图
4. 执行：

```bash
npm run ios:sync
```

5. 用 Xcode 真机运行，确认桌面图标、启动页和登录页品牌露出一致。
6. 如果已提交微信开放平台，回到开放平台重新上传应用图片。
7. 如果已提交 App Store Connect，重新上传 App 图标和截图。

## 当前建议

现阶段可以继续使用当前 Logo 先推进登录、行情和真机测试。如果你想让品牌更高级，可以下一轮做一版更 App Store 化的图标：减少细节、增强 K 线/放大镜识别度、提高小尺寸可读性。
