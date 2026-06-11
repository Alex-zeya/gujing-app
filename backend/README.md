# 股镜后端

这是股镜 App 的第一版本地后端，用 FastAPI + SQLite 承载前端已经成型的数据结构。

## 本地启动

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
backend/.venv/bin/python -m uvicorn main:app --reload --reload-exclude 'backend/.venv/*' --host 0.0.0.0 --port 8010 --app-dir backend
```

接口文档：

- http://localhost:8010/docs
- http://localhost:8010/api/health

后端测试：

```bash
npm run backend:test
```

## 当前接口

- `GET /api/data/status`
- `POST /api/data/refresh`
- `POST /api/data/snapshot`
- `GET /api/data/tushare/status`
- `POST /api/data/tushare/token`
- `POST /api/data/sync-universe`
- `GET /api/stocks`
- `GET /api/stocks/search?keyword=600519`
- `GET /api/stocks/{code}`
- `POST /api/stocks/{code}/history/refresh`
- `GET /api/stocks/{code}/kline`
- `GET /api/stocks/{code}/snapshots`
- `GET /api/market/overview`
- `GET /api/recommendations/today`
- `GET /api/watchlist?refresh=false`
- `POST /api/watchlist`
- `DELETE /api/watchlist/{code}`
- `GET /api/portfolio?refresh=false`
- `GET /api/portfolio/insights?refresh=false`
- `POST /api/portfolio`
- `PATCH /api/portfolio/{code}`
- `POST /api/portfolio/{code}/sell`
- `DELETE /api/portfolio/{code}`
- `GET /api/portfolio/transactions`
- `GET /api/portfolio/{code}/transactions`
- `GET /api/alerts/settings`
- `POST /api/alerts/settings`
- `GET /api/auth/sms/status`
- `POST /api/auth/sms/send`
- `POST /api/auth/sms/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/devices`
- `DELETE /api/auth/devices/{device_id}`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `GET /api/user/summary`
- `GET /api/user/export`

## 登录和短信验证码

本地开发默认使用模拟短信：

```bash
export SMS_PROVIDER=mock
```

此时 `POST /api/auth/sms/send` 会返回 `devCode`，方便前期测试登录流程，不会真的发短信。

正式上线前可以切换 provider：

```bash
export SMS_PROVIDER=aliyun
export ALIYUN_SMS_ACCESS_KEY_ID="..."
export ALIYUN_SMS_ACCESS_KEY_SECRET="..."
export ALIYUN_SMS_SIGN_NAME="..."
export ALIYUN_SMS_TEMPLATE_CODE="..."
```

或：

```bash
export SMS_PROVIDER=tencent
export TENCENT_SMS_SECRET_ID="..."
export TENCENT_SMS_SECRET_KEY="..."
export TENCENT_SMS_SDK_APP_ID="..."
export TENCENT_SMS_SIGN_NAME="..."
export TENCENT_SMS_TEMPLATE_ID="..."
```

当前后端已经完成 provider 配置校验、发送接口结构和日志记录。真实阿里云/腾讯云 SDK 调用还需要在拿到账号资质后接入。

## 登录设备

登录成功后，后端会在 `auth_sessions` 中记录设备名、客户端信息、最近活跃时间和过期时间。

前端或 iOS App 可以通过请求头传入设备名：

```http
X-Device-Name: Alex 的 iPhone
```

设备管理接口：

- `GET /api/auth/devices` 查看当前账户登录设备。
- `DELETE /api/auth/devices/{device_id}` 撤销某个设备登录。
- `POST /api/auth/logout` 只退出当前设备。

## 行情刷新

`POST /api/data/refresh` 会优先尝试用 easyquotation 刷新 A股实时报价，再尝试用 AKShare 刷新行情和 K线，并写入 SQLite 缓存。

如果 easyquotation、AKShare 或东方财富临时限流、断连，接口会返回 `fallback` 状态，前端继续使用缓存/演示数据，不会白屏。

`GET /api/portfolio` 和 `GET /api/watchlist` 默认走快速缓存模式，不会为了等外部行情源而卡住页面。需要用户主动刷新时，可以调用 `?refresh=true` 强制尝试联网刷新当前报价；这类列表刷新只更新实时/准实时价格，不拉历史 K线。后台任务也会按配置间隔自动更新持仓和观察池行情。

## 搜索

`GET /api/stocks/search` 支持股票代码、中文名称、行业关键词和拼音首字母。比如 `payh` 可以匹配 `平安银行`，`zgsy` 可以匹配 `中国石油`。

## 预测评分

股票分析结果会带 `analysisScore.forecast`，当前为 `v1-rule-stat`。它根据短期动量、均线结构、波动风险、新闻样本和数据完整度输出 5 日/20 日偏强概率、波动安全分和解释因子。这个模型只做概率和风险观察，不承诺收益，也不构成证券投资建议。

## 用户数据导出

`GET /api/user/export` 会导出当前用户资料、观察池、持仓、交易流水、提醒记录和账户摘要。这个接口不触发行情刷新，适合后续做云端备份、换设备同步或导出文件。

## 自建日快照

`POST /api/data/snapshot` 会用 easyquotation 同步 A股全市场行情，并把当天的 open/high/low/close/成交量/成交额保存到 `stock_daily_snapshots`。

这不是一次性补全历史，而是从今天开始积累自己的历史库。积累到 20 个交易日后，后端会用自建快照计算近一月走势和 K线，作为持仓建议的免费数据基础。

## 历史 K线

历史日 K 优先使用 Tushare。需要配置 token：

```bash
export TUSHARE_TOKEN="你的 token"
npm run backend
```

也可以用接口保存到本地 SQLite：

```bash
curl -X POST http://localhost:8010/api/data/tushare/token \
  -H "Content-Type: application/json" \
  -d '{"token":"你的 token"}'
```

配置后，前端搜索股票时会自动尝试调用 `POST /api/stocks/{code}/history/refresh` 补充历史日 K、近一月走势和 K线图数据。

如果当前 Tushare token 没有 `daily` 接口权限，后端会自动切到东方财富公开日 K 接口，先让 App 立即拿到历史价格、K线图和近一月走势。

当前 MVP 的数据路径：

- 实时/准实时价格：`easyquotation`，用于全 A股搜索、当前价、今日涨跌。
- 历史日 K：Tushare 优先，东方财富公开接口兜底。
- 自建日快照：每天调用 `POST /api/data/snapshot` 后逐步沉淀自己的行情库。

东方财富公开接口适合前期验证产品体验，但它不是正式授权的数据服务，可能出现限流、字段变化或临时不可用。正式上线前建议补一个稳定授权数据源。

## 持仓流水

`POST /api/portfolio` 现在除了更新持仓汇总，也会写入 `portfolio_transactions`，记录本次加入持仓的股票、金额、股数、成本价和时间。

`POST /api/portfolio/{code}/sell` 用来卖出或减仓，可以传 `shares` 或 `amount`，后端会扣减对应股数并记录 `sell` 流水；如果减到 0 股，会自动移出持仓。

`PATCH /api/portfolio/{code}` 用来修改持仓股数、成本价或持仓金额，并记录 `adjust` 流水。这个接口适合用户手动纠正导入数据。

`DELETE /api/portfolio/{code}` 会在移出持仓前记录一条 `remove` 流水，方便后续分析用户历史操作。

前端或 App 可以读取：

- `GET /api/portfolio/insights` 查看组合风险评分、分类集中度、近期操作统计和行动建议。
- `GET /api/portfolio/transactions` 查看当前用户最近持仓操作。
- `GET /api/portfolio/{code}/transactions` 查看单只股票的持仓操作历史。

这部分后面可以继续扩展成“买入/卖出/减仓/加仓/成本变化”的完整组合归因，用来解释系统为什么建议继续持有、减仓或观察。
