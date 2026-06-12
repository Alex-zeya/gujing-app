# 股镜 Gujing

股镜是一款面向个人投资者的股票研究辅助 App。它的目标不是替用户下买卖决定，而是把 A 股行情、持仓、观察池、新闻线索、K 线和组合风险整理成更容易理解的风险框架。

当前项目仍处于 MVP / 内测阶段，主要服务于创始人和身边小范围用户。产品第一阶段只做 A 股分析，后续如果数据源和合规条件成熟，再考虑扩展到美股、港股等市场。

> 重要说明：股镜只做信息整理、概率观察和风险提示，不构成证券投资建议，不承诺收益，也不替用户做交易决策。

## 当前状态

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 前端 App | 已成型 | React + Vite 实现移动端优先界面，已接入 Capacitor iOS 工程。 |
| 后端 API | 已接入 | FastAPI 承载登录、股票、行情、持仓、观察池、提醒和系统状态接口。 |
| A 股搜索 | 已支持 | 支持代码、中文名称、行业关键词和拼音首字母搜索。 |
| 行情数据 | 可用但需增强 | 使用免费源和缓存兜底，正式上线前仍需稳定授权数据源策略。 |
| K 线和基础字段 | 已接入兜底 | Tushare 优先，公开数据源兜底，缺字段时保留缓存。 |
| 持仓与交易流水 | 已支持 | 支持加入持仓、买入、卖出、调整、收益和本金计算。 |
| 组合风险 | 已支持 | 根据行业集中度、单股集中度、收益分布和波动状态给出风险提示。 |
| 登录系统 | 接入中 | 首版改为 Apple 登录 + 微信登录；Apple iOS 原生桥接已加入，微信登录已具备后端换码和 App 状态检测，短信验证码仅保留为后续备用能力。 |
| iOS 工程 | 已接入 | Capacitor iOS 项目已生成，可用 Xcode 真机运行。 |
| App Store 上架 | 未完成 | 还需要在 Xcode/Apple Developer 开启 Apple 登录能力、公开隐私政策 URL、审核素材和真机回归。 |

## 核心功能

### 首页

- 市场概览：展示 A 股市场上涨占比、情绪和更新时间。
- 今日值得关注：滚动展示系统认为波动较高、值得跟踪的股票。
- 波动雷达：结合行情、K 线、新闻缓存和用户持仓/观察池，提示未来可能波动较大的股票。
- 推荐股票：基于当前行情、趋势和研究评分给出观察理由。

### 找股票

- 支持股票代码、中文名称、行业关键词和拼音首字母搜索。
- 搜索后展示：
  - 当前价、涨跌幅
  - K 线走势
  - 今日开盘价、昨日收盘价、今日高低点
  - 历史高点、成交量、成交额、企业市值等字段
  - 持仓建议、未来走势推断、系统分析
- 可以一键加入观察池或持仓。

### 持仓

- 用户可以录入持仓金额、股数、成本价。
- 支持买入、卖出、调整持仓。
- 计算：
  - 本金
  - 当前市值
  - 今日盈亏
  - 已实现收益
  - 未实现收益
  - 单股和组合风险
- 根据不同用户持仓结构给出针对性提示，而不是所有股票套同一套文案。

### 观察池

- 展示用户关注的股票、涨跌、理由和提醒状态。
- 支持继续跟踪、删除、打开分析。
- 支持提醒规则和通知设置。
- 当前首版更偏 App 内提醒；真正 iOS 系统推送需要后续接 APNs。

### 我的

- 用户资料、风险偏好、默认市场。
- 运行监控：查看后端健康分、行情覆盖、任务状态、错误日志。
- 上线准备度：显示当前距离 TestFlight / App Store 上线还差什么。
- 隐私说明、风险说明、删除账户 / 清除数据。

## 技术架构

```text
React / Vite 前端
        |
        |  REST API
        v
FastAPI 后端
        |
        |-- SQLite 本地开发
        |-- PostgreSQL 生产部署
        |
        |-- easyquotation / AKShare / 东方财富公开接口
        |-- Tushare 历史 K 线和基础字段
        |-- 后台任务：行情、快照、免费基本面补全
        |
        v
Capacitor iOS 工程
```

## 数据源说明

当前 MVP 采用“免费源优先 + 缓存兜底”的方式：

- 实时/准实时行情：`easyquotation`
- A 股目录和部分公开行情字段：`AKShare`
- 历史 K 线：Tushare 优先，东方财富公开接口兜底
- 基础估值字段：Tushare `daily_basic` 优先，免费公开字段兜底
- 自建日快照：每天积累 open/high/low/close/成交量/成交额

免费数据源适合早期验证产品体验，但不保证长期稳定、完整或实时。正式上线前需要进一步评估数据授权、稳定性和合规风险。

## 本地运行

### 1. 安装依赖

```bash
npm install
```

后端依赖需要 Python 虚拟环境：

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

### 2. 启动后端

```bash
npm run backend
```

默认地址：

- API：http://localhost:8010
- API 文档：http://localhost:8010/docs
- 健康检查：http://localhost:8010/api/health

### 3. 启动前端

```bash
npm run dev
```

默认地址：

- Web App：http://localhost:5173
- 隐私政策草案：http://localhost:5173/privacy.html
- 支持中心草案：http://localhost:5173/support.html
- 线上隐私政策：https://gujing-api.onrender.com/privacy.html
- 线上支持中心：https://gujing-api.onrender.com/support.html

## 常用命令

```bash
# 后端测试
npm run backend:test

# 前端 lint
npm run lint

# 生产构建
npm run build

# Playwright 端到端测试
npm run test:e2e

# 检查本地上线准备度
npm run readiness

# 检查线上后端上线准备度
npm run readiness -- https://gujing-api.onrender.com

# 对比线上部署环境、数据库、Tushare 和每日补全任务
npm run deploy:check -- https://gujing-api.onrender.com
```

## iOS 真机运行

项目已接入 Capacitor，iOS 工程位于 `ios/`。

首次准备：

```bash
cp .env.ios.example .env.ios
```

如果是真机测试，需要把 `.env.ios` 里的 `VITE_API_BASE_URL` 改成 iPhone 可以访问的 HTTPS 后端地址。模拟器本地调试可以使用 `http://localhost:8010`。

同步 Web 产物到 iOS：

```bash
npm run ios:sync
```

打开 Xcode：

```bash
npm run ios:open
```

Xcode 中需要配置：

- Apple ID Team
- Bundle Identifier
- Automatically manage signing
- 真机信任开发者证书

## 部署

项目已经准备 Docker 和 Render Blueprint：

- [Dockerfile](./Dockerfile)
- [render.yaml](./render.yaml)
- [.env.production.example](./.env.production.example)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

Render 部署后建议先检查：

```bash
npm run readiness -- https://你的后端域名
npm run deploy:check -- https://你的后端域名
```

上线前重点确认：

- 线上数据库是 PostgreSQL，而不是 SQLite。
- `APP_ENV=production`
- `DATABASE_URL` 已生效。
- `TUSHARE_TOKEN` 已配置；如果 token 权限不足，历史 K 线继续走免费源兜底。
- `/api/data/backfill/daily` 可访问，后台任务包含 `daily_data_backfill`。
- `/api/system/readiness` 里的 `stockDirectory` 达到全量 A 股目录阈值，默认不少于 4500 只。
- `/api/system/readiness` 里的 `dailyBackfill` 显示已注册，并且首次手动补全可以成功返回。
- `CORS_ORIGINS` 包含 iOS WebView 和正式前端来源。
- `VITE_API_BASE_URL` 指向 HTTPS 后端。
- `PRIVACY_POLICY_URL` 是公开 HTTPS 地址。
  - 当前后端也会公开 `/privacy.html` 和 `/support.html`，Render 默认可使用 `https://gujing-api.onrender.com/privacy.html`。
- 短信服务商不再使用 mock。

如果 `deploy:check` 显示线上仍是 SQLite、股票目录只有少量种子数据、每日补全接口返回 404，或 readiness 里没有 `stockDirectory` / `dailyBackfill` 字段，优先在 Render 里执行 **Manual Deploy / Blueprint Sync** 重新部署最新 `main` 分支，并确认 Blueprint 或环境变量已经把 `DATABASE_URL`、`TUSHARE_TOKEN`、`MIN_A_STOCK_DIRECTORY_COUNT` 注入到 `gujing-api` 服务。

## 上线前剩余工作

当前不建议直接公开上架 App Store，还需要：

1. Render 线上服务部署最新代码。
2. 确认线上数据库切到 PostgreSQL。
3. 在 Apple Developer 和 Xcode target 中开启 Sign in with Apple；微信登录需要完成微信开放平台移动应用配置并接入 iOS OpenSDK。
4. 部署公开隐私政策 URL。
5. 部署公开支持 URL。
6. 完成 iPhone 真机完整回归测试。
7. 准备 App Store 图标、启动页、截图、描述、关键词和审核说明。
8. 继续优化数据源稳定性，让缺失字段展示为“同步中”“样本积累中”或“暂未披露”。
9. 如需要系统通知，接入 Apple Push Notification service。

更详细的上线清单见：

- [docs/LAUNCH_READINESS.md](./docs/LAUNCH_READINESS.md)
- [docs/APP_STORE_REVIEW_CHECKLIST.md](./docs/APP_STORE_REVIEW_CHECKLIST.md)
- [docs/QA_TEST_REPORT.md](./docs/QA_TEST_REPORT.md)

## 项目定位

股镜的产品原则：

- 先解释风险，再谈机会。
- 让刚进入股票市场的人也能看懂。
- 不做夸张荐股，不写“稳赚”“必涨”“主力拉升”。
- 所有建议都要有理由、风险和数据状态。
- 手机优先，适合日常查看持仓和观察池。

## 免责声明

本项目处于早期开发和研究阶段。页面和接口中的分析、评分、趋势推断、持仓建议、推荐关注股票等内容，只用于信息整理、风险观察和产品体验演示，不构成任何证券投资建议。用户应结合自身风险承受能力，并通过正规持牌机构完成投资决策。
