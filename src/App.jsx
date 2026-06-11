import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CheckCheck,
  LogOut,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trash2,
  UserRound,
} from 'lucide-react'
import './App.css'

let stocks = {
  '600519': {
    code: '600519',
    name: '贵州茅台',
    market: 'cn',
    industry: '白酒',
    price: '1,586.20',
    change: '+0.84%',
    performance: { day: 0.84, week: 2.42, month: -1.16 },
    sparkline: [42, 45, 44, 49, 47, 51, 55, 53, 58, 61],
    chart: [1542, 1556, 1549, 1571, 1564, 1580, 1593, 1588, 1604, 1586],
    tone: 'neutral',
    pulse: '现金流稳定，关注估值和消费修复。',
    updated: '今日 15:08',
    score: 78,
    tags: ['现金流强', '消费复苏', '估值敏感'],
    idea: {
      stance: '继续研究',
      horizon: '中长期',
      reason: '经营质量和现金流稳定，适合作为消费龙头观察样本。',
      risk: '估值对增长放缓较敏感，批价和库存若走弱会压制情绪。',
      trigger: '若下一季收入恢复且批价稳定，研究优先级上调。',
    },
    metrics: [
      ['毛利率', '91.5%', '稳定'],
      ['净利增速', '15.7%', '放缓'],
      ['负债率', '19.3%', '较低'],
    ],
    signals: [
      {
        title: '基本面',
        level: '稳健',
        text: '收入和利润质量仍处于头部水平，短期看渠道库存和高端消费恢复。',
      },
      {
        title: '估值',
        level: '偏贵',
        text: '估值包含确定性溢价，业绩增速放缓会压制弹性。',
      },
      {
        title: '新闻',
        level: '中性',
        text: '消息集中在批价、分红和消费修复，需结合财报看。',
      },
    ],
    checklist: [
      '下一季收入增速是否继续低于利润增速',
      '批价和库存是否出现连续走弱',
      '分红率变化是否支持长期资金配置',
    ],
  },
  '300750': {
    code: '300750',
    name: '宁德时代',
    market: 'cn',
    industry: '动力电池',
    price: '188.64',
    change: '-1.12%',
    performance: { day: -1.12, week: 3.18, month: 7.64 },
    sparkline: [40, 39, 42, 45, 44, 48, 51, 49, 53, 52],
    chart: [176, 181, 180, 184, 187, 192, 190, 195, 191, 188],
    tone: 'warning',
    pulse: '动量改善，但利润率压力仍高。',
    updated: '今日 14:56',
    score: 66,
    tags: ['新能源', '价格竞争', '全球化'],
    idea: {
      stance: '波动观察',
      horizon: '中短期',
      reason: '行业龙头地位仍强，周/月维度动量改善明显。',
      risk: '产业链价格竞争和毛利率变化会放大股价波动。',
      trigger: '若海外订单和储能增长继续兑现，动量信号增强。',
    },
    metrics: [
      ['毛利率', '22.4%', '承压'],
      ['研发费用', '高', '投入强'],
      ['现金储备', '充足', '安全垫'],
    ],
    signals: [
      {
        title: '基本面',
        level: '分化',
        text: '龙头地位仍在，价格竞争继续影响利润率预期。',
      },
      {
        title: '估值',
        level: '需观察',
        text: '估值已回落，弹性看海外收入、储能和毛利率。',
      },
      {
        title: '新闻',
        level: '偏敏感',
        text: '订单、贸易政策和电池价格会影响短期情绪。',
      },
    ],
    checklist: [
      '动力电池价格是否继续下探',
      '海外工厂和客户订单是否按计划推进',
      '储能业务是否能贡献更稳定利润',
    ],
  },
  '000001': {
    code: '000001',
    name: '平安银行',
    market: 'cn',
    industry: '银行',
    price: '10.72',
    change: '+0.19%',
    performance: { day: 0.19, week: -0.72, month: 1.86 },
    sparkline: [44, 43, 42, 44, 45, 43, 46, 47, 46, 48],
    chart: [10.42, 10.36, 10.48, 10.55, 10.51, 10.63, 10.58, 10.69, 10.66, 10.72],
    tone: 'safe',
    pulse: '低估值高股息，关注息差和资产质量。',
    updated: '今日 15:01',
    score: 72,
    tags: ['高股息', '低估值', '息差压力'],
    idea: {
      stance: '防御配置',
      horizon: '中期',
      reason: '估值处于低位，高股息属性对组合波动有一定缓冲。',
      risk: '息差收窄和资产质量变化会影响重估空间。',
      trigger: '若分红政策稳定且资产质量改善，配置吸引力提升。',
    },
    metrics: [
      ['市净率', '0.48x', '较低'],
      ['股息率', '较高', '防御'],
      ['不良率', '平稳', '需跟踪'],
    ],
    signals: [
      {
        title: '基本面',
        level: '防御',
        text: '盈利弹性一般，估值和分红提供一定安全边际。',
      },
      {
        title: '估值',
        level: '低位',
        text: '当前估值反映息差和地产链风险担忧。',
      },
      {
        title: '新闻',
        level: '低波动',
        text: '重点看政策、地产信用和分红方案。',
      },
    ],
    checklist: [
      '净息差是否继续收窄',
      '涉房资产风险是否稳定',
      '分红政策是否维持',
    ],
  },
}

const searchSeedStocks = stockListToMap([
  { code: '601727', name: '上海电气', market: 'cn', industry: '电气设备' },
  { code: '600875', name: '东方电气', market: 'cn', industry: '电气设备' },
  { code: '688660', name: '电气风电', market: 'cn', industry: '风电设备' },
  { code: '600312', name: '平高电气', market: 'cn', industry: '电网设备' },
  { code: '000400', name: '许继电气', market: 'cn', industry: '电网设备' },
  { code: '002028', name: '思源电气', market: 'cn', industry: '电网设备' },
  { code: '601877', name: '正泰电器', market: 'cn', industry: '低压电器' },
  { code: '300274', name: '阳光电源', market: 'cn', industry: '电源设备' },
  { code: '600406', name: '国电南瑞', market: 'cn', industry: '电网自动化' },
  { code: '600089', name: '特变电工', market: 'cn', industry: '电力设备' },
  { code: '601012', name: '隆基绿能', market: 'cn', industry: '光伏设备' },
  { code: '300124', name: '汇川技术', market: 'cn', industry: '工业自动化' },
  { code: '601857', name: '中国石油', market: 'cn', industry: '石油石化' },
].map((stock, index) => createSearchSeedStock(stock, index)))

stocks = { ...stocks, ...searchSeedStocks }

const defaultPortfolio = [
  { code: '600519', name: '贵州茅台', amount: 42000, industry: '白酒' },
  { code: '300750', name: '宁德时代', amount: 26000, industry: '动力电池' },
]

const tabs = [
  { id: 'home', label: '首页', icon: Sparkles },
  { id: 'discover', label: '找股票', icon: Search },
  { id: 'portfolio', label: '持仓', icon: BriefcaseBusiness },
  { id: 'watch', label: '观察', icon: Bell },
  { id: 'profile', label: '我的', icon: UserRound },
]

const marketOverviews = {
  cn: {
    updated: '15:20',
    breadth: 63,
    mood: '偏强',
    summary: '上涨家数占优，消费电子和新能源偏强。',
    indices: [
      { name: '沪深300', value: '3,612.48', change: '+0.62%' },
      { name: '创业板指', value: '1,826.30', change: '+0.88%' },
      { name: '上证指数', value: '3,108.42', change: '+0.37%' },
    ],
    sectors: [
      { name: '消费电子', change: '+1.84%', tone: 'up' },
      { name: '动力电池', change: '+1.12%', tone: 'up' },
      { name: '银行', change: '-0.21%', tone: 'down' },
    ],
    globalMarkets: [
      { id: 'cn', name: 'A股', mood: '偏强', metric: '上涨占比', value: '63%', change: '+0.37%', source: '实时监看' },
      { id: 'hk', name: '港股', mood: '分化', metric: '上涨占比', value: '49%', change: '-0.28%', source: '监看位' },
      { id: 'us', name: '美股', mood: '温和', metric: '上涨占比', value: '58%', change: '+0.41%', source: '监看位' },
    ],
    marketDetails: {
      cn: {
        name: 'A股',
        summary: '上涨家数占优，消费电子和新能源偏强。',
        indices: [
          { name: '沪深300', value: '3,612.48', change: '+0.62%' },
          { name: '创业板指', value: '1,826.30', change: '+0.88%' },
          { name: '上证指数', value: '3,108.42', change: '+0.37%' },
        ],
        sectors: [
          { name: '消费电子', change: '+1.84%', tone: 'up' },
          { name: '动力电池', change: '+1.12%', tone: 'up' },
          { name: '银行', change: '-0.21%', tone: 'down' },
        ],
      },
      hk: {
        name: '港股',
        breadth: 49,
        summary: '港股更受互联网龙头、地产链和南向资金影响，当前适合作为风险偏好观察窗口。',
        indices: [
          { name: '恒生指数', value: '18,142.60', change: '+0.18%' },
          { name: '恒生科技', value: '4,238.11', change: '-0.28%' },
          { name: '国企指数', value: '6,421.08', change: '+0.09%' },
        ],
        sectors: [
          { name: '互联网', change: '+1.22%', tone: 'up' },
          { name: '保险', change: '+0.41%', tone: 'up' },
          { name: '地产', change: '-0.86%', tone: 'down' },
          { name: '医药', change: '-0.34%', tone: 'down' },
        ],
      },
      us: {
        name: '美股',
        breadth: 58,
        summary: '美股重点看大型科技、AI 算力、利率预期和财报节奏，适合观察全球风险偏好。',
        indices: [
          { name: '纳斯达克', value: '18,804.03', change: '+0.41%' },
          { name: '标普500', value: '5,432.80', change: '+0.26%' },
          { name: '道琼斯', value: '39,118.20', change: '-0.12%' },
        ],
        sectors: [
          { name: '大型科技', change: '+0.92%', tone: 'up' },
          { name: '半导体', change: '+0.66%', tone: 'up' },
          { name: '消费', change: '+0.33%', tone: 'up' },
          { name: '能源', change: '-0.38%', tone: 'down' },
        ],
      },
    },
  },
  us: {
    updated: '盘中',
    breadth: 58,
    mood: '温和',
    summary: '大型科技股仍有支撑，关注财报和利率预期。',
    indices: [
      { name: '纳斯达克', value: '18,804.03', change: '+0.41%' },
      { name: '标普500', value: '5,432.80', change: '+0.26%' },
      { name: '道琼斯', value: '39,118.20', change: '-0.12%' },
    ],
    sectors: [
      { name: '科技', change: '+0.92%', tone: 'up' },
      { name: '消费', change: '+0.33%', tone: 'up' },
      { name: '能源', change: '-0.38%', tone: 'down' },
    ],
  },
  jp: {
    updated: '收盘',
    breadth: 55,
    mood: '稳中偏强',
    summary: '汽车和出口链表现较稳，汇率仍是主要变量。',
    indices: [
      { name: '日经225', value: '39,102.14', change: '+0.48%' },
      { name: 'TOPIX', value: '2,782.21', change: '+0.31%' },
      { name: '东证成长', value: '681.42', change: '-0.22%' },
    ],
    sectors: [
      { name: '汽车', change: '+1.04%', tone: 'up' },
      { name: '机械', change: '+0.52%', tone: 'up' },
      { name: '地产', change: '-0.34%', tone: 'down' },
    ],
  },
  hk: {
    updated: '16:10',
    breadth: 49,
    mood: '分化',
    summary: '互联网龙头较强，地产和部分金融仍偏弱。',
    indices: [
      { name: '恒生指数', value: '18,142.60', change: '+0.18%' },
      { name: '恒生科技', value: '4,238.11', change: '-0.28%' },
      { name: '国企指数', value: '6,421.08', change: '+0.09%' },
    ],
    sectors: [
      { name: '互联网', change: '+1.22%', tone: 'up' },
      { name: '保险', change: '+0.41%', tone: 'up' },
      { name: '地产', change: '-0.86%', tone: 'down' },
    ],
  },
}

const alertTemplates = [
  '价格突破近 10 日高点',
  '单日涨跌幅超过 3%',
  '出现公告或财报更新',
  '建议发生变化',
  '跌破支撑或接近压力',
]

const notificationChannels = ['手机系统通知', '收盘摘要']

const defaultUserSummary = {
  profile: {
    id: 'default_user',
    displayName: 'Alex-w',
    riskLevel: '稳健',
    defaultMarket: 'A股',
  },
  stats: {
    portfolioCount: 0,
    watchlistCount: 0,
    unreadAlerts: 0,
    portfolioValue: 0,
  },
}

const riskLevels = ['稳健', '均衡', '进取']

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8010'
const AUTH_TOKEN_KEY = 'gujing-auth-token'

function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

async function apiJson(path, options) {
  const { headers = {}, timeoutMs = 12000, skipAuth = false, ...fetchOptions } = options ?? {}
  const token = skipAuth ? null : getStoredAuthToken()
  const tunnelHeaders = API_BASE_URL.includes('loca.lt') ? { 'bypass-tunnel-reminder': 'true' } : {}
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...tunnelHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
    if (!response.ok) {
      if (response.status === 401) clearStoredAuthToken()
      let detail = ''
      try {
        detail = await response.text()
      } catch {
        detail = ''
      }
      throw new Error(`API ${path} failed with ${response.status}${detail ? `: ${detail.slice(0, 120)}` : ''}`)
    }
    return response.json()
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`API ${path} timed out`, { cause: error })
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function stockListToMap(list) {
  return list.reduce((acc, stock) => {
    acc[stock.code] = stock
    return acc
  }, {})
}

function createSearchSeedStock(stock, index = 0) {
  const base = Number((58 + (index % 5) * 2).toFixed(2))
  return {
    ...stock,
    price: stock.price ?? '0.00',
    change: stock.change ?? '0.00%',
    performance: stock.performance ?? { day: 0, week: 0, month: 0 },
    sparkline: stock.sparkline ?? [42, 42, 43, 42, 44, 43, 45, 44, 45, 46],
    chart: stock.chart ?? [base, base, base, base, base, base, base, base, base, base],
    tone: stock.tone ?? 'neutral',
    pulse: stock.pulse ?? '已匹配企业名称，点击后会补充行情和K线。',
    updated: stock.updated ?? '待同步',
    score: stock.score ?? 58,
    tags: stock.tags ?? [stock.industry, '名称匹配'],
    idea: stock.idea ?? {
      stance: '先观察',
      horizon: '短中期',
      reason: '已从股票名称目录匹配，等待行情和历史走势补充。',
      risk: '当前数据未完整同步，先不要只凭名称判断持仓。',
      trigger: '行情同步后再查看趋势、价格和系统建议。',
    },
    metrics: stock.metrics ?? [['状态', '待同步', '行情'], ['分类', stock.industry, '目录'], ['数据源', '名称目录', '搜索']],
    signals: stock.signals ?? [
      { title: '搜索', level: '已匹配', text: '企业名称与关键词匹配。' },
      { title: '行情', level: '待同步', text: '点击分析后会尝试补充实时价格。' },
      { title: '风险', level: '需观察', text: '需要结合K线、成交额和行业变化再判断。' },
    ],
    checklist: stock.checklist ?? ['同步实时价格', '补充历史K线', '查看行业和公告变化'],
    dataCoverage: stock.dataCoverage ?? { quote: false, history: false, fundamental: false },
  }
}

function portfolioSnapshotToItems(snapshot) {
  return snapshot.items.map((item) => ({
    code: item.code,
    name: item.name,
    amount: item.amount,
    shares: item.shares ?? 0,
    costPrice: item.costPrice ?? 0,
    currentPrice: item.currentPrice ?? 0,
    marketValue: item.marketValue ?? item.amount,
    dayGain: item.dayGain ?? 0,
    totalGain: item.totalGain ?? 0,
    totalGainRate: item.totalGainRate ?? 0,
    positionRatio: item.positionRatio ?? 0,
    positionAdvice: item.positionAdvice ?? '继续观察。',
    industry: displayCategory(item.industry, item.stock ?? item),
  }))
}

function displayCategory(value, stock = {}) {
  const raw = String(value || '')
  const text = [
    raw,
    stock.name,
    stock.code,
    stock.industry,
    ...(stock.tags ?? []),
    stock.pulse,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (raw && raw !== 'A股') {
    if (/白酒|食品|饮料|消费|乳|啤酒|调味|家电|零售|旅游/.test(raw)) return '消费'
    if (/银行|证券|保险|金融|信托/.test(raw)) return '金融'
    if (/医疗|医药|生物|药|医院|健康|器械|疫苗|诊断/.test(raw)) return '医药健康'
    if (/新能源|电池|锂|储能|光伏|风电|电气|电力|能源/.test(raw)) return '电气能源'
    if (/人工智能|智能|ai|软件|云|数据|信息|算法/.test(raw)) return '人工智能'
    if (/芯片|半导体|电子|光电|通信|科技|计算机/.test(raw)) return '科技'
    if (/机器人|自动化|机械|机床|工业|制造|船舶|军工|航空|航天|材料|化工|特气/.test(raw)) return '工业制造'
    if (/石油|煤|有色|钢铁|矿|资源|地产|建筑|建材|水泥/.test(raw)) return '传统行业'
    return raw
  }

  if (/人工智能|智能|ai|算法|软件|云|数据|信息|算力/.test(text)) return '人工智能'
  if (/科技|芯片|半导体|电子|光电|通信|计算机|新材|材料/.test(text)) return '科技'
  if (/电气|电力|新能源|电池|锂|储能|光伏|风电|能源/.test(text)) return '电气能源'
  if (/工业|制造|机械|机器人|自动化|机床|船舶|军工|航空|航天|特气|化工/.test(text)) return '工业制造'
  if (/银行|证券|保险|金融|信托/.test(text)) return '金融'
  if (/白酒|食品|饮料|消费|啤酒|乳|家电|零售|旅游/.test(text)) return '消费'
  if (/医疗|医药|生物|药|医院|健康|器械|疫苗|诊断/.test(text)) return '医药健康'
  if (/石油|煤|有色|钢铁|矿|资源|地产|建筑|建材|水泥/.test(text)) return '传统行业'
  return '其他'
}

function currency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function stockPriceNumber(stock) {
  const value = Number(String(stock?.price ?? '').replace(/,/g, ''))
  return Number.isFinite(value) ? value : 0
}

function hasLivePrice(stock) {
  return stockPriceNumber(stock) > 0
}

function displayStockPrice(stock) {
  return hasLivePrice(stock) ? stock.price : '待同步'
}

function displayStockMove(stock) {
  return hasLivePrice(stock) ? formatPercent(stock.performance.day) : '待同步'
}

function StockPriceLine({ stock, compact = false }) {
  return (
    <span className={compact ? 'stock-price-line is-compact' : 'stock-price-line'}>
      <b>{hasLivePrice(stock) ? `¥${stock.price}` : '待同步'}</b>
      {hasLivePrice(stock) && <em>/股</em>}
    </span>
  )
}

function formatStatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '待补充'
  if (typeof value === 'number') return `${value.toFixed(2)}${suffix}`
  return `${value}${suffix}`
}

function formatLevelValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '待补充'
  if (typeof value === 'number') return `${value.toFixed(value >= 100 ? 1 : 2)}${suffix}`
  return `${value}${suffix}`
}

function buildStockStats(stock, candles = null) {
  const stats = stock.quoteStats ?? {}
  const klineRows = candles?.length ? candles : stock.klineRows ?? []
  const chart = stock.chart ?? []
  const lastCandle = klineRows.at(-1)
  const previousCandle = klineRows.at(-2)
  const historyHigh = stats.historyHigh
    ?? (klineRows.length ? Math.max(...klineRows.map((item) => item.high)) : null)
    ?? (chart.length ? Math.max(...chart) : null)
  const previousClose = stats.previousClose
    ?? previousCandle?.close
    ?? null

  return [
    ['今日开盘价', stats.open ?? lastCandle?.open],
    ['昨日收市价', previousClose],
    ['今日最高价', stats.dayHigh ?? lastCandle?.high],
    ['今日最低价', stats.dayLow ?? lastCandle?.low],
    ['历史最高价', historyHigh],
    ['成交量', stats.volume],
    ['成交额', stats.amount],
    ['企业市值', stats.marketCap],
  ]
}

function trendClass(value) {
  return value >= 0 ? 'is-up' : 'is-down'
}

function cleanCode(value) {
  return value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 8)
}

function findStockByQuery(value, stockMap = stocks) {
  const rawQuery = value.trim()
  const codeQuery = cleanCode(rawQuery)
  if (codeQuery && stockMap[codeQuery]?.market === 'cn') return stockMap[codeQuery]
  if (!rawQuery) return null

  const normalizedQuery = rawQuery.toLowerCase()
  return Object.values(stockMap).find((stock) => {
    const code = stock.code.toLowerCase()
    const name = stock.name.toLowerCase()
    const industry = stock.industry.toLowerCase()
    return (
      stock.market === 'cn'
      && (
        code.includes(normalizedQuery)
        || name.includes(normalizedQuery)
        || industry.includes(normalizedQuery)
      )
    )
  }) ?? null
}

function localStockSuggestions(value, stockMap = stocks, limit = 6) {
  const rawQuery = value.trim()
  const codeQuery = cleanCode(rawQuery).toLowerCase()
  if (!rawQuery) return []

  const normalizedQuery = rawQuery.toLowerCase()
  return Object.values(stockMap)
    .filter((stock) => {
      if (stock.market !== 'cn') return false
      const code = stock.code.toLowerCase()
      const name = stock.name.toLowerCase()
      const industry = stock.industry.toLowerCase()
      return (
        (codeQuery ? code.includes(codeQuery) : false)
        || name.includes(normalizedQuery)
        || industry.includes(normalizedQuery)
      )
    })
    .sort((a, b) => {
      const aCode = a.code.toLowerCase()
      const bCode = b.code.toLowerCase()
      if (codeQuery && aCode.startsWith(codeQuery) && !bCode.startsWith(codeQuery)) return -1
      if (codeQuery && !aCode.startsWith(codeQuery) && bCode.startsWith(codeQuery)) return 1
      return b.score - a.score
    })
    .slice(0, limit)
}

function mergeStockLists(primary, secondary, limit = 8) {
  const order = []
  const byCode = new Map()
  const liveScore = (stock) => {
    const price = Number(String(stock?.price ?? 0).replace(/,/g, ''))
    return (price > 0 ? 2 : 0) + (stock?.quoteStats?.source ? 1 : 0) + (stock?.dataCoverage?.quote ? 1 : 0)
  }

  ;[...primary, ...secondary].forEach((stock) => {
    if (!stock?.code) return
    if (!byCode.has(stock.code)) order.push(stock.code)
    const existing = byCode.get(stock.code)
    if (!existing || liveScore(stock) >= liveScore(existing)) {
      byCode.set(stock.code, { ...existing, ...stock })
    }
  })

  return order.map((code) => byCode.get(code)).filter(Boolean).slice(0, limit)
}

function buildStockDecision(stock) {
  const engine = stock.analysisScore?.advice
  if (engine) {
    return {
      hasHistory: stock.dataCoverage?.history ?? stock.industry !== 'A股',
      holdingAdvice: engine.stance,
      trendView: engine.trendView || engine.summary,
      systemAnalysis: engine.systemAnalysis || `${stock.name}综合评分 ${engine.total}，${engine.summary}。主要风险：${engine.risk}`,
      riskView: engine.risk,
      rules: engine.rules ?? [],
    }
  }

  const monthMove = Number(stock.performance?.month ?? 0)
  const weekMove = Number(stock.performance?.week ?? 0)
  const dayMove = Number(stock.performance?.day ?? 0)
  const score = Number(stock.score ?? 60)
  const hasHistory = stock.dataCoverage?.history ?? stock.industry !== 'A股'
  const isWeak = monthMove <= -8 || (monthMove < -3 && weekMove < -2)
  const isStrong = monthMove >= 6 && weekMove >= -1
  const isRecovering = monthMove > 0 && weekMove >= 0
  const isVolatile = Math.abs(dayMove) >= 3 || Math.abs(weekMove) >= 6
  const industryHint = stock.industry && stock.industry !== 'A股'
    ? `${stock.industry}板块`
    : '所属板块'

  if (!hasHistory) {
    return {
      hasHistory,
      holdingAdvice: '先观察，不建议仅凭实时涨跌重仓',
      trendView: '当前只有实时价格，历史 K 线还在补充中，先看价格是否连续稳定，再判断仓位。',
      systemAnalysis: `已读取实时价格和今日涨跌，但缺少完整历史走势。${industryHint}、财报和成交量还需要补充后再做判断。`,
    }
  }

  if (isWeak) {
    return {
      hasHistory,
      holdingAdvice: isVolatile ? '控制仓位，先等波动收敛' : '暂不建议重仓持有',
      trendView: `近一月下跌 ${Math.abs(monthMove).toFixed(2)}%，趋势仍偏弱。更适合等价格企稳、周线不再继续走低后再重新评估。`,
      systemAnalysis: `${stock.name}当前主要问题是趋势修复不足，短线反弹也容易被前期套牢盘压制。若已经持有，重点看成交量是否放大、跌幅是否收窄，以及${industryHint}有没有明显改善。`,
    }
  }

  if (isStrong) {
    return {
      hasHistory,
      holdingAdvice: score >= 70 ? '可以继续持仓观察' : '趋势较强，但不要追高加仓',
      trendView: `近一月上涨 ${monthMove.toFixed(2)}%，价格仍有惯性。短期重点看回撤时能不能守住近 10 日均价区域。`,
      systemAnalysis: `${stock.name}短期走势占优，但上涨后风险也会变高。适合把观察重点放在成交额持续性、公告变化和${industryHint}热度是否延续。`,
    }
  }

  if (isRecovering) {
    return {
      hasHistory,
      holdingAdvice: '可以轻仓观察，暂不急于加仓',
      trendView: `近一月小幅修复 ${monthMove.toFixed(2)}%，走势开始改善但还不算强。需要再看 3 到 5 个交易日确认。`,
      systemAnalysis: `${stock.name}目前更像修复阶段，适合作为观察样本。若后续价格能站稳并且成交额不萎缩，持仓信心会更高；若冲高回落，则继续按风险股处理。`,
    }
  }

  return {
    hasHistory,
    holdingAdvice: isVolatile ? '波动偏大，持仓要留安全垫' : '中性观察，等待更明确方向',
    trendView: `近一月变化 ${formatPercent(monthMove)}，方向还不够明确。未来一个月更可能围绕区间震荡。`,
    systemAnalysis: `${stock.name}目前没有形成很清晰的趋势信号，系统更关注两个条件：价格是否突破近期高点，以及回落时成交量是否明显放大。`,
  }
}

function fallbackAnalysisScore(stock) {
  const decision = buildStockDecision(stock)
  const total = Number(stock.score ?? 60)
  return {
    total,
    stance: decision.holdingAdvice,
    reasons: [decision.trendView],
    factors: [
      { name: '短期动量', score: Math.max(0, Math.min(100, 50 + stock.performance.day * 3)), text: `今日 ${displayStockMove(stock)}` },
      { name: '趋势质量', score: Math.max(0, Math.min(100, 50 + stock.performance.month * 2)), text: `近一月 ${formatPercent(stock.performance.month)}` },
      { name: '数据完整度', score: stock.dataCoverage?.history ? 80 : 45, text: stock.dataCoverage?.history ? '已接入历史K线' : '历史数据待补充' },
    ],
  }
}

function buildPortfolioAdvice(portfolio, concentration, portfolioDayGain) {
  if (!portfolio.length) {
    return ['还没有持仓数据，先添加股票后再生成组合建议。']
  }

  const topHolding = portfolio.reduce((top, item) => ((item.marketValue ?? item.amount) > (top.marketValue ?? top.amount) ? item : top), portfolio[0])
  const topStock = stocks[topHolding.code]
  const topRatio = concentration.ratio
  const topDecision = topStock ? buildStockDecision(topStock) : null
  const totalGain = portfolio.reduce((sum, item) => sum + (item.totalGain ?? 0), 0)
  const weakHolding = portfolio.find((item) => (item.totalGainRate ?? 0) <= -8)
  const advice = []

  if (topRatio >= 60) {
    advice.push(`${concentration.industry}占比 ${topRatio}%，组合对单一分类变化比较敏感，新增资金先不要继续集中到这个方向。`)
  } else if (topRatio >= 40) {
    advice.push(`${concentration.industry}是当前第一大分类，占比 ${topRatio}%。可以继续持有，但加仓时优先看其他分类，降低组合波动。`)
  } else {
    advice.push(`当前分类分布相对分散，第一大分类占比 ${topRatio}%，组合结构暂时不算拥挤。`)
  }

  if (topStock && topDecision) {
    advice.push(`最大持仓是${topStock.name}，系统判断为“${topDecision.holdingAdvice}”。这只股票会明显影响组合体验，需要优先跟踪。`)
  }

  if (weakHolding) {
    advice.push(`${weakHolding.name} 当前累计盈亏 ${formatPercent(weakHolding.totalGainRate)}，需要优先确认是否还符合原来的持仓理由。`)
  } else if (totalGain > 0) {
    advice.push(`组合累计盈利 ${currency(totalGain)}，可以考虑把观察重点放在止盈计划和仓位再平衡。`)
  }

  if (portfolioDayGain < 0) {
    advice.push(`今日组合暂时亏损 ${currency(Math.abs(portfolioDayGain))}，先看亏损是否集中在单只股票，避免情绪化加仓。`)
  } else if (portfolioDayGain > 0) {
    advice.push(`今日组合暂时盈利 ${currency(portfolioDayGain)}，可以检查收益是否来自少数股票，避免误判整体风险。`)
  }

  return advice
}

function getStoredWatchlist() {
  try {
    const stored = localStorage.getItem('gujing-watchlist')
    if (!stored) return ['600519']
    const parsed = JSON.parse(stored).filter((code) => stocks[code]?.market === 'cn')
    return parsed.length ? parsed : ['600519']
  } catch {
    return ['600519']
  }
}

function getStoredRecentSearches() {
  try {
    const stored = localStorage.getItem('gujing-recent-searches')
    if (!stored) return ['600519', '300750', '000001']
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.slice(0, 5) : ['600519', '300750', '000001']
  } catch {
    return ['600519', '300750', '000001']
  }
}

function LogoMark() {
  return (
    <svg viewBox="0 0 42 42" role="presentation" aria-hidden="true">
      <path className="logo-lens" d="M20.5 6.5a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z" />
      <path className="logo-handle" d="M30.5 30.5 36 36" />
      <path className="logo-base" d="M10.5 29.5h19.5" />
      <path className="logo-candle" d="M14.5 25V15M14.5 20h4.8M21.5 27V11.5M21.5 16.5h5.2M28.5 23.5V14.5M28.5 19h4" />
    </svg>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const screenRef = useRef(null)
  const [query, setQuery] = useState('600519')
  const [selectedCode, setSelectedCode] = useState('600519')
  const [stockCatalog, setStockCatalog] = useState(stocks)
  const stockCatalogRef = useRef(stocks)
  const [recommendedStocks, setRecommendedStocks] = useState([])
  const [dismissedRecommendationCodes, setDismissedRecommendationCodes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gujing-dismissed-recommendations') || '[]')
    } catch {
      return []
    }
  })
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchNotice, setSearchNotice] = useState('')
  const [marketOverview, setMarketOverview] = useState(marketOverviews.cn)
  const [portfolio, setPortfolio] = useState(defaultPortfolio)
  const [portfolioInsights, setPortfolioInsights] = useState(null)
  const [portfolioAdviceHistory, setPortfolioAdviceHistory] = useState({})
  const [portfolioBacktests, setPortfolioBacktests] = useState({ status: 'idle', summary: null, items: [] })
  const [watchlist, setWatchlist] = useState(getStoredWatchlist)
  const [recentSearches, setRecentSearches] = useState(getStoredRecentSearches)
  const [draft, setDraft] = useState({ code: '', amount: '' })
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [analysisFocusToken, setAnalysisFocusToken] = useState(0)
  const [apiStatus, setApiStatus] = useState('connecting')
  const [dataStatus, setDataStatus] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [isRefreshingData, setIsRefreshingData] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const pullStartYRef = useRef(null)
  const isPullingRef = useRef(false)
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false)
  const [klineCandles, setKlineCandles] = useState(null)
  const [klineReturnTab, setKlineReturnTab] = useState('watch')
  const [portfolioPrompt, setPortfolioPrompt] = useState(null)
  const [portfolioInput, setPortfolioInput] = useState({
    mode: 'amount',
    amount: '10000',
    shares: '',
    costPrice: '',
  })
  const [portfolioPromptError, setPortfolioPromptError] = useState('')
  const [isSubmittingPortfolio, setIsSubmittingPortfolio] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    channels: ['手机系统通知'],
    rules: ['出现公告或财报更新', '建议发生变化', '跌破支撑或接近压力'],
    checkIntervalMinutes: 15,
  })
  const [alertEvents, setAlertEvents] = useState([])
  const [alertUnreadCount, setAlertUnreadCount] = useState(0)
  const [alertMonitorStatus, setAlertMonitorStatus] = useState(null)
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState(false)
  const [userSummary, setUserSummary] = useState(defaultUserSummary)
  const [isSavingUserProfile, setIsSavingUserProfile] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [authSession, setAuthSession] = useState({
    authenticated: Boolean(getStoredAuthToken()),
    profile: defaultUserSummary.profile,
  })
  const [authNotice, setAuthNotice] = useState('')
  const [legalPanel, setLegalPanel] = useState(null)

  stocks = stockCatalog
  stockCatalogRef.current = stockCatalog
  const selectedStock = stocks[selectedCode] ?? stocks['600519']
  const marketStocks = Object.values(stocks).filter((stock) => stock.market === 'cn')
  const recentStocks = recentSearches
    .map((code) => stocks[code])
    .filter((stock) => stock?.market === 'cn')
    .slice(0, 5)
  const totalAmount = portfolio.reduce((sum, item) => sum + item.amount, 0)

  function switchTab(tabId) {
    setActiveTab(tabId)
  }

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activeTab])

  function handleScreenTouchStart(event) {
    if (screenRef.current?.scrollTop !== 0 || isRefreshingData) return
    pullStartYRef.current = event.touches[0]?.clientY ?? null
    isPullingRef.current = false
  }

  function handleScreenTouchMove(event) {
    const startY = pullStartYRef.current
    if (startY === null || screenRef.current?.scrollTop !== 0 || isRefreshingData) return
    const currentY = event.touches[0]?.clientY ?? startY
    const distance = currentY - startY
    if (distance <= 0) return
    isPullingRef.current = true
    setPullDistance(Math.min(78, distance * 0.55))
  }

  function handleScreenTouchEnd() {
    const shouldRefresh = isPullingRef.current && pullDistance >= 38
    pullStartYRef.current = null
    isPullingRef.current = false
    setPullDistance(0)
    if (shouldRefresh && !isRefreshingData) {
      void refreshMarketData()
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadBackendData() {
      if (!authSession.authenticated) {
        setApiStatus('connected')
        return
      }
      try {
        let authData = await apiJson('/api/auth/me')
        if (!authData.authenticated) {
          clearStoredAuthToken()
          if (!isMounted) return
          setAuthSession({ authenticated: false, profile: defaultUserSummary.profile })
          setApiStatus('connected')
          return
        }
        if (authData.shouldRefresh) {
          authData = await apiJson('/api/auth/refresh', { method: 'POST' })
          if (authData.token) localStorage.setItem(AUTH_TOKEN_KEY, authData.token)
        }

        const [stockList, overview, recommendations, watchItems, portfolioSnapshot, insights, alertSettings, alertFeed, providerStatus, taskData, userData, readiness] = await Promise.all([
          apiJson('/api/stocks'),
          apiJson('/api/market/overview'),
          apiJson('/api/recommendations/today'),
          apiJson('/api/watchlist'),
          apiJson('/api/portfolio'),
          apiJson('/api/portfolio/insights'),
          apiJson('/api/alerts/settings'),
          apiJson('/api/alerts/events'),
          apiJson('/api/data/status'),
          apiJson('/api/tasks/status'),
          apiJson('/api/user/summary'),
          apiJson('/api/system/readiness'),
        ])

        if (!isMounted) return
        setStockCatalog((current) => ({
          ...searchSeedStocks,
          ...current,
          ...stockListToMap([...stockList, ...recommendations]),
        }))
        setRecommendedStocks(recommendations)
        setMarketOverview(overview)
        setWatchlist(watchItems.map((stock) => stock.code))
        setPortfolio(portfolioSnapshotToItems(portfolioSnapshot))
        setPortfolioInsights(insights)
        setNotificationSettings(alertSettings)
        setAlertEvents(alertFeed.events ?? [])
        setAlertUnreadCount(alertFeed.unreadCount ?? 0)
        setAlertMonitorStatus(alertFeed.status ?? null)
        setDataStatus(providerStatus)
        setTaskStatus(taskData)
        setUserSummary(userData)
        setSystemStatus(readiness)
        setAuthSession(authData)
        setApiStatus('connected')
      } catch {
        if (!isMounted) return
        if (!getStoredAuthToken()) {
          setAuthSession({ authenticated: false, profile: defaultUserSummary.profile })
          setApiStatus('connected')
          return
        }
        setApiStatus('offline')
      }
    }

    loadBackendData()
    return () => {
      isMounted = false
    }
  }, [authSession.authenticated])

  useEffect(() => {
    if (!authSession.authenticated) return undefined

    async function refreshMarketModules() {
      try {
        const [overview, recommendations, alertFeed, providerStatus, taskData, readiness] = await Promise.all([
          apiJson('/api/market/overview'),
          apiJson('/api/recommendations/today'),
          apiJson('/api/alerts/events'),
          apiJson('/api/data/status'),
          apiJson('/api/tasks/status'),
          apiJson('/api/system/readiness'),
        ])
        setMarketOverview(overview)
        setRecommendedStocks(recommendations)
        setStockCatalog((current) => ({
          ...current,
          ...stockListToMap(recommendations),
        }))
        setAlertEvents(alertFeed.events ?? [])
        setAlertUnreadCount(alertFeed.unreadCount ?? 0)
        setAlertMonitorStatus(alertFeed.status ?? null)
        setDataStatus(providerStatus)
        setTaskStatus(taskData)
        setSystemStatus(readiness)
        setApiStatus('connected')
      } catch {
        setApiStatus('offline')
      }
    }

    const timer = window.setInterval(refreshMarketModules, 15 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [authSession.authenticated])

  useEffect(() => {
    const keyword = query.trim()
    if (!keyword || activeTab !== 'discover') {
      return undefined
    }

    const localMatches = localStockSuggestions(keyword, stockCatalogRef.current, 6)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSuggesting(true)
      try {
        const backendMatches = await apiJson(
          `/api/stocks/search?keyword=${encodeURIComponent(keyword)}`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        setStockCatalog((current) => ({
          ...current,
          ...stockListToMap(backendMatches),
        }))
        setSearchSuggestions(mergeStockLists(localMatches, backendMatches, 8))
        setApiStatus('connected')
      } catch {
        if (!controller.signal.aborted) setSearchSuggestions(localMatches)
      } finally {
        if (!controller.signal.aborted) setIsSuggesting(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [activeTab, query])

  useEffect(() => {
    let isMounted = true

    async function loadKline() {
      if (activeTab !== 'kline' || !selectedCode) return
      try {
        const data = await apiJson(`/api/stocks/${selectedCode}/kline`)
        if (!isMounted) return
        setKlineCandles(data.candles)
        if (data.stock) {
          setStockCatalog((current) => ({
            ...current,
            [data.stock.code]: data.stock,
          }))
        }
        setApiStatus('connected')
      } catch {
        if (isMounted) {
          setKlineCandles(null)
          setApiStatus('offline')
        }
      }
    }

    loadKline()
    return () => {
      isMounted = false
    }
  }, [activeTab, selectedCode])

  useEffect(() => {
    let isMounted = true

    async function loadHistoryForAnalysis() {
      const selected = stocks[selectedCode]
      if (!hasAnalyzed || !selected || selected.klineRows?.length) return
      try {
        const updatedStock = await apiJson(`/api/stocks/${selectedCode}/history/refresh`, {
          method: 'POST',
        })
        if (!isMounted) return
        setStockCatalog((current) => ({
          ...current,
          [updatedStock.code]: updatedStock,
        }))
        setApiStatus('connected')
      } catch {
        if (isMounted) setApiStatus('connected')
      }
    }

    loadHistoryForAnalysis()
    return () => {
      isMounted = false
    }
  }, [hasAnalyzed, selectedCode])

  useEffect(() => {
    let isMounted = true

    async function loadNewsForAnalysis() {
      if (!hasAnalyzed || !selectedCode) return
      try {
        const data = await apiJson(`/api/stocks/${selectedCode}/news`)
        if (!isMounted || !data.newsImpact) return
        setStockCatalog((current) => {
          const stock = current[selectedCode]
          if (!stock) return current
          return {
            ...current,
            [selectedCode]: {
              ...stock,
              newsImpact: data.newsImpact,
            },
          }
        })
        setApiStatus('connected')
      } catch {
        if (isMounted) setApiStatus('connected')
      }
    }

    loadNewsForAnalysis()
    return () => {
      isMounted = false
    }
  }, [hasAnalyzed, selectedCode])

  const concentration = useMemo(() => {
    const byIndustry = portfolio.reduce((acc, item) => {
      const category = item.industry
      acc[category] = (acc[category] || 0) + (item.marketValue ?? item.amount)
      return acc
    }, {})
    const entries = Object.entries(byIndustry).sort((a, b) => b[1] - a[1])
    const top = entries[0] ?? ['无', 0]
    return {
      industry: top[0],
      ratio: totalAmount ? Math.round((top[1] / totalAmount) * 100) : 0,
      entries,
    }
  }, [portfolio, totalAmount])

  async function runSearch(event) {
    event.preventDefault()
    const displayQuery = query.trim()
    if (!displayQuery) {
      setSearchNotice('先输入股票代码、企业名称或关键词。')
      setHasAnalyzed(false)
      return
    }

    setSearchNotice('')
    const localMatches = localStockSuggestions(displayQuery, stockCatalogRef.current, 8)
    const stock = findStockByQuery(displayQuery, stockCatalogRef.current)
    if (stock) {
      selectStockForAnalysis(stock, displayQuery || stock.name)
      return
    }

    try {
      setIsSuggesting(true)
      const results = await apiJson(`/api/stocks/search?keyword=${encodeURIComponent(query.trim())}`)
      const cnResults = results.filter((item) => item.market === 'cn')
      const mergedResults = mergeStockLists(localMatches, cnResults, 8)
      if (mergedResults.length > 1) {
        setStockCatalog((current) => ({
          ...current,
          ...stockListToMap(mergedResults),
        }))
        setSearchSuggestions(mergedResults)
        setIsSearchFocused(true)
        setSearchNotice(`找到 ${mergedResults.length} 只相关股票，点企业名称进入分析。`)
        setApiStatus('connected')
        return
      }
      if (mergedResults.length === 1) {
        const matchedStock = mergedResults[0]
        setStockCatalog((current) => ({
          ...current,
          [matchedStock.code]: matchedStock,
        }))
        selectStockForAnalysis(matchedStock, displayQuery || matchedStock.name)
        setApiStatus('connected')
        return
      }
    } catch {
      setApiStatus('offline')
      if (localMatches.length) {
        setSearchSuggestions(localMatches)
        setIsSearchFocused(true)
        setSearchNotice(`网络暂时较慢，先显示 ${localMatches.length} 只本地匹配股票。`)
        return
      }
    } finally {
      setIsSuggesting(false)
    }

    setSearchNotice('暂时没有找到匹配股票，可以换企业全称或股票代码。')
    setHasAnalyzed(false)
  }

  function updateSearchQuery(value) {
    setQuery(value)
    setSearchNotice('')
    const keyword = value.trim()
    if (!keyword) {
      setSearchSuggestions([])
      setIsSuggesting(false)
      return
    }
    setSearchSuggestions(localStockSuggestions(keyword, stockCatalogRef.current, 6))
  }

  async function hydrateStockForAnalysis(code) {
    try {
      const data = await apiJson(`/api/stocks/${code}/kline`)
      const updatedStock = data.stock
        ? { ...data.stock, klineRows: data.candles ?? data.stock.klineRows }
        : null
      if (updatedStock) {
        setStockCatalog((current) => ({
          ...current,
          [updatedStock.code]: updatedStock,
        }))
      }
      setApiStatus('connected')
    } catch {
      setApiStatus('connected')
    }
  }

  function selectStockForAnalysis(stock, displayValue = stock.name) {
    const clean = cleanCode(stock.code)
    setStockCatalog((current) => ({
      ...current,
      [clean]: { ...stock, code: clean },
    }))
    setSelectedCode(clean)
    setQuery(displayValue)
    setHasAnalyzed(true)
    setAnalysisFocusToken((current) => current + 1)
    void hydrateStockForAnalysis(clean)
    setSearchSuggestions([])
    setIsSearchFocused(false)
    setRecentSearches((current) => {
      const next = [clean, ...current.filter((code) => code !== clean)].slice(0, 5)
      localStorage.setItem('gujing-recent-searches', JSON.stringify(next))
      return next
    })
  }

  function saveWatchlist(nextList) {
    setWatchlist(nextList)
    localStorage.setItem('gujing-watchlist', JSON.stringify(nextList))
  }

  async function recordRecommendationFeedback(code, action, source = 'home') {
    try {
      await apiJson('/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify({ code, action, source }),
      })
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function addStockToWatchlist(code) {
    const stock = stockCatalogRef.current[code] ?? stocks[code]
    if (stock?.market !== 'cn') return
    if (watchlist.includes(code)) return
    const nextList = [code, ...watchlist]
    saveWatchlist(nextList)
    void recordRecommendationFeedback(code, 'watch', 'home')
    try {
      const nextWatchlist = await apiJson('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setWatchlist(nextWatchlist.map((stock) => stock.code))
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  function dismissRecommendation(code) {
    setDismissedRecommendationCodes((current) => {
      const next = [code, ...current.filter((item) => item !== code)].slice(0, 20)
      localStorage.setItem('gujing-dismissed-recommendations', JSON.stringify(next))
      return next
    })
    void recordRecommendationFeedback(code, 'dismiss', 'home')
  }

  function analyzeRecommendation(stock) {
    void recordRecommendationFeedback(stock.code, 'analyze', 'home')
    selectStockForAnalysis(stock, stock.name)
    setActiveTab('discover')
  }

  async function removeFromWatchlist(code) {
    const nextList = watchlist.filter((item) => item !== code)
    saveWatchlist(nextList)
    try {
      const nextWatchlist = await apiJson(`/api/watchlist/${code}`, {
        method: 'DELETE',
      })
      setWatchlist(nextWatchlist.map((stock) => stock.code))
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function addHolding(event) {
    event.preventDefault()
    let stock = findStockByQuery(draft.code, stockCatalogRef.current)
    const amount = Number(draft.amount)
    if (!stock && draft.code.trim()) {
      try {
        const results = await apiJson(`/api/stocks/search?keyword=${encodeURIComponent(draft.code.trim())}`)
        stock = results.find((item) => item.market === 'cn')
        if (stock) {
          setStockCatalog((current) => ({
            ...current,
            [stock.code]: stock,
          }))
        }
      } catch {
        setApiStatus('offline')
      }
    }
    if (!stock || stock.market !== 'cn' || !amount || amount <= 0) return

    await addStockToPortfolio(stock.code, amount)
    setDraft({ code: '', amount: '' })
  }

  async function addStockToPortfolio(code, amount = 10000, options = {}) {
    const clean = cleanCode(code)
    const stock = stockCatalogRef.current[clean] ?? stocks[clean]
    if (!stock || stock.market !== 'cn') return
    const costPrice = Number(options.costPrice || stockPriceNumber(stock))
    const shares = Number(options.shares || 0)

    setPortfolio((items) => {
      const existing = items.find((item) => item.code === clean)
      if (existing) {
        return items.map((item) =>
          item.code === clean
            ? {
                ...item,
                amount: item.amount + amount,
                marketValue: (item.marketValue ?? item.amount) + amount,
              }
            : item,
        )
      }
      return [
        ...items,
        {
          code: stock.code,
          name: stock.name,
          amount,
          shares,
          costPrice,
          marketValue: amount,
          dayGain: amount * (stock.performance.day / 100),
          totalGain: 0,
          totalGainRate: 0,
          positionRatio: 0,
          positionAdvice: '正在同步持仓分析。',
          industry: displayCategory(stock.industry, stock),
        },
      ]
    })

    try {
      const snapshot = await apiJson('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          code: clean,
          amount,
          shares: shares || undefined,
          costPrice: costPrice || undefined,
        }),
      })
      setPortfolio(portfolioSnapshotToItems(snapshot))
      const insights = await apiJson('/api/portfolio/insights')
      setPortfolioInsights(insights)
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  function openPortfolioPrompt(code) {
    const clean = cleanCode(code)
    const stock = stockCatalogRef.current[clean] ?? stocks[clean]
    if (!stock || stock.market !== 'cn') return
    setPortfolioPrompt(stock)
    setPortfolioPromptError('')
    setPortfolioInput({
      mode: 'amount',
      amount: '10000',
      shares: '',
      costPrice: hasLivePrice(stock) ? stock.price.replace(/,/g, '') : '',
    })
  }

  async function submitPortfolioPrompt(event) {
    event.preventDefault()
    if (!portfolioPrompt) return

    const costPrice = Number(portfolioInput.costPrice || stockPriceNumber(portfolioPrompt))
    const shares = Number(portfolioInput.shares)
    const amount = portfolioInput.mode === 'amount'
      ? Number(portfolioInput.amount)
      : shares * costPrice

    if (!costPrice || costPrice <= 0) {
      setPortfolioPromptError('请先填写有效的成本价。')
      return
    }
    if (portfolioInput.mode === 'shares' && (!shares || shares <= 0)) {
      setPortfolioPromptError('请先填写持仓股数。')
      return
    }
    if (portfolioInput.mode === 'amount' && (!amount || amount <= 0)) {
      setPortfolioPromptError('请先填写持仓金额。')
      return
    }

    setPortfolioPromptError('')
    setIsSubmittingPortfolio(true)
    try {
      await addStockToPortfolio(portfolioPrompt.code, Math.round(amount), {
        shares: portfolioInput.mode === 'shares' ? shares : undefined,
        costPrice,
      })
      setPortfolioPrompt(null)
    } finally {
      setIsSubmittingPortfolio(false)
    }
  }

  async function removeHolding(code) {
    setPortfolio((items) => items.filter((item) => item.code !== code))
    setPortfolioAdviceHistory((current) => {
      const next = { ...current }
      delete next[code]
      return next
    })
    try {
      const snapshot = await apiJson(`/api/portfolio/${code}`, {
        method: 'DELETE',
      })
      setPortfolio(portfolioSnapshotToItems(snapshot))
      const insights = await apiJson('/api/portfolio/insights')
      setPortfolioInsights(insights)
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function loadPortfolioAdviceHistory(code) {
    const clean = cleanCode(code)
    if (!clean) return
    const existing = portfolioAdviceHistory[clean]
    if (existing?.status === 'loaded' || existing?.status === 'loading') return
    setPortfolioAdviceHistory((current) => ({
      ...current,
      [clean]: { status: 'loading', items: [] },
    }))
    try {
      const result = await apiJson(`/api/portfolio/${clean}/advice-history?limit=5`)
      setPortfolioAdviceHistory((current) => ({
        ...current,
        [clean]: { status: 'loaded', items: result.items ?? [] },
      }))
      setApiStatus('connected')
    } catch {
      setPortfolioAdviceHistory((current) => ({
        ...current,
        [clean]: { status: 'error', items: [] },
      }))
      setApiStatus('offline')
    }
  }

  async function loadPortfolioBacktests() {
    if (portfolioBacktests.status === 'loading') return
    setPortfolioBacktests((current) => ({
      ...current,
      status: 'loading',
    }))
    try {
      await apiJson('/api/portfolio/advice-backtests/run', { method: 'POST' })
      const result = await apiJson('/api/portfolio/advice-backtests?limit=30')
      setPortfolioBacktests({
        status: 'loaded',
        summary: result.summary ?? null,
        items: result.items ?? [],
      })
      setApiStatus('connected')
    } catch {
      setPortfolioBacktests((current) => ({
        ...current,
        status: 'error',
      }))
      setApiStatus('offline')
    }
  }

  async function updateNotificationSettings(nextSettings) {
    setNotificationSettings(nextSettings)
    try {
      const savedSettings = await apiJson('/api/alerts/settings', {
        method: 'POST',
        body: JSON.stringify(nextSettings),
      })
      setNotificationSettings(savedSettings)
      const alertFeed = await apiJson('/api/alerts/events')
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      setAlertMonitorStatus(alertFeed.status ?? null)
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function refreshUserSummary() {
    try {
      const nextSummary = await apiJson('/api/user/summary')
      setUserSummary(nextSummary)
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function saveUserProfile(nextProfile) {
    setIsSavingUserProfile(true)
    try {
      const savedProfile = await apiJson('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(nextProfile),
      })
      const nextSummary = await apiJson('/api/user/summary')
      setUserSummary({
        ...nextSummary,
        profile: savedProfile,
      })
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    } finally {
      setIsSavingUserProfile(false)
    }
  }

  async function sendLoginCode(phone) {
    const result = await apiJson('/api/auth/sms/send', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ phone }),
    })
    setAuthNotice(result.devCode ? `开发验证码：${result.devCode}` : '验证码已发送')
    return result
  }

  async function loginWithPhone(phone, code) {
    const result = await apiJson('/api/auth/sms/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    })
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    setAuthSession(result)
    setAuthNotice('登录成功')
    const [watchItems, portfolioSnapshot, insights, alertSettings, alertFeed, taskData, userData, readiness] = await Promise.all([
      apiJson('/api/watchlist'),
      apiJson('/api/portfolio'),
      apiJson('/api/portfolio/insights'),
      apiJson('/api/alerts/settings'),
      apiJson('/api/alerts/events'),
      apiJson('/api/tasks/status'),
      apiJson('/api/user/summary'),
      apiJson('/api/system/readiness'),
    ])
    setWatchlist(watchItems.map((stock) => stock.code))
    setPortfolio(portfolioSnapshotToItems(portfolioSnapshot))
    setPortfolioInsights(insights)
    setNotificationSettings(alertSettings)
    setAlertEvents(alertFeed.events ?? [])
    setAlertUnreadCount(alertFeed.unreadCount ?? 0)
    setAlertMonitorStatus(alertFeed.status ?? null)
    setTaskStatus(taskData)
    setUserSummary(userData)
    setSystemStatus(readiness)
    setApiStatus('connected')
    return result
  }

  async function loginWithWechat() {
    try {
      await apiJson('/api/auth/wechat/login', {
        method: 'POST',
        body: JSON.stringify({ code: 'wechat_app_code_placeholder' }),
      })
    } catch {
      setAuthNotice('微信登录需要先配置微信开放平台 AppID 和 Secret')
    }
  }

  async function logoutUser() {
    try {
      await apiJson('/api/auth/logout', { method: 'POST' })
    } catch {
      // Keep local logout responsive even if the token has already expired.
    }
    clearStoredAuthToken()
    setAuthSession({ authenticated: false, profile: defaultUserSummary.profile })
    setAuthNotice('已退出登录')
    window.location.reload()
  }

  async function deleteAccount() {
    setIsDeletingAccount(true)
    try {
      await apiJson('/api/user/account', { method: 'DELETE' })
      clearStoredAuthToken()
      localStorage.removeItem('gujing-watchlist')
      localStorage.removeItem('gujing-recent-searches')
      localStorage.removeItem('gujing-dismissed-recommendations')
      setAuthSession({ authenticated: false, profile: defaultUserSummary.profile })
      setAuthNotice('账户和个人数据已删除')
      window.location.reload()
    } catch {
      setAuthNotice('删除账户失败，请稍后再试')
      setApiStatus('offline')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  async function refreshMarketData() {
    setIsRefreshingData(true)
    try {
      await apiJson('/api/data/refresh', {
        method: 'POST',
        body: JSON.stringify({ codes: marketStocks.map((stock) => stock.code) }),
      })
      const [stockList, overview, recommendations, portfolioSnapshot, insights, alertFeed, providerStatus, taskData, userData, readiness] = await Promise.all([
        apiJson('/api/stocks'),
        apiJson('/api/market/overview'),
        apiJson('/api/recommendations/today'),
        apiJson('/api/portfolio'),
        apiJson('/api/portfolio/insights'),
        apiJson('/api/alerts/events'),
        apiJson('/api/data/status'),
        apiJson('/api/tasks/status'),
        apiJson('/api/user/summary'),
        apiJson('/api/system/readiness'),
      ])
      setStockCatalog((current) => ({
        ...searchSeedStocks,
        ...current,
        ...stockListToMap([...stockList, ...recommendations]),
      }))
      setRecommendedStocks(recommendations)
      setMarketOverview(overview)
      setPortfolio(portfolioSnapshotToItems(portfolioSnapshot))
      setPortfolioInsights(insights)
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      setAlertMonitorStatus(alertFeed.status ?? null)
      setTaskStatus(taskData)
      setUserSummary(userData)
      setSystemStatus(readiness)
      setDataStatus(providerStatus)
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
      setDataStatus({
        mode: 'fallback',
        source: 'akshare',
        lastRefresh: null,
        message: '刷新失败，继续使用当前缓存数据。',
        refreshedCodes: [],
      })
    } finally {
      setIsRefreshingData(false)
    }
  }

  async function checkAlertEvents() {
    setIsCheckingAlerts(true)
    try {
      const alertFeed = await apiJson('/api/alerts/check', { method: 'POST' })
      const taskData = await apiJson('/api/tasks/status')
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      setAlertMonitorStatus(alertFeed.status ?? null)
      setTaskStatus(taskData)
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    } finally {
      setIsCheckingAlerts(false)
    }
  }

  async function markAllAlertsRead() {
    setAlertEvents((events) => events.map((event) => ({ ...event, read: true })))
    setAlertUnreadCount(0)
    try {
      const alertFeed = await apiJson('/api/alerts/read', { method: 'POST' })
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  async function markAlertRead(eventId) {
    setAlertEvents((events) => events.map((event) => (event.id === eventId ? { ...event, read: true } : event)))
    setAlertUnreadCount((count) => Math.max(0, count - 1))
    try {
      const alertFeed = await apiJson(`/api/alerts/${eventId}/read`, { method: 'POST' })
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
    }
  }

  if (!authSession.authenticated) {
    return (
      <>
        <LoginScreen
          authNotice={authNotice}
          sendLoginCode={sendLoginCode}
          loginWithPhone={loginWithPhone}
          loginWithWechat={loginWithWechat}
          openLegalPanel={setLegalPanel}
        />
        {legalPanel && <LegalSheet type={legalPanel} onClose={() => setLegalPanel(null)} />}
      </>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <LogoMark />
        </div>
        <div>
          <p className="caption">股票研究辅助</p>
          <h1>股镜</h1>
        </div>
        <span className="market-chip">Beta</span>
        <button className="icon-button" type="button" aria-label="风险说明" onClick={() => setLegalPanel('risk')}>
          <ShieldAlert size={19} />
        </button>
      </header>

      <section
        className={`screen${pullDistance > 0 || isRefreshingData ? ' is-pulling' : ''}`}
        ref={screenRef}
        aria-live="polite"
        onTouchCancel={handleScreenTouchEnd}
        onTouchEnd={handleScreenTouchEnd}
        onTouchMove={handleScreenTouchMove}
        onTouchStart={handleScreenTouchStart}
      >
        <div
          className={`pull-refresh${pullDistance >= 38 ? ' is-ready' : ''}${isRefreshingData ? ' is-refreshing' : ''}`}
          style={{ transform: `translateY(${isRefreshingData ? 42 : pullDistance}px)` }}
        >
          <span>{isRefreshingData ? '刷新中' : pullDistance >= 38 ? '松开刷新' : '下拉刷新'}</span>
        </div>
        <div
          className="pull-content"
          style={{ transform: `translateY(${isRefreshingData ? 18 : pullDistance}px)` }}
        >
        {activeTab === 'home' && (
          <HomeView
            marketStocks={marketStocks}
            recommendedStocks={recommendedStocks}
            dismissedRecommendationCodes={dismissedRecommendationCodes}
            marketOverview={marketOverview}
            watchlist={watchlist}
            addStockToWatchlist={addStockToWatchlist}
            dismissRecommendation={dismissRecommendation}
            analyzeRecommendation={analyzeRecommendation}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            concentration={concentration}
            totalAmount={totalAmount}
            portfolioInsights={portfolioInsights}
            stockCatalog={stockCatalog}
            draft={draft}
            setDraft={setDraft}
            addHolding={addHolding}
            removeHolding={removeHolding}
            adviceHistory={portfolioAdviceHistory}
            loadAdviceHistory={loadPortfolioAdviceHistory}
            backtests={portfolioBacktests}
            loadBacktests={loadPortfolioBacktests}
            setActiveTab={setActiveTab}
            setKlineReturnTab={setKlineReturnTab}
            setSelectedCode={setSelectedCode}
            setQuery={setQuery}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            query={query}
            setQuery={updateSearchQuery}
            runSearch={runSearch}
            searchSuggestions={searchSuggestions}
            isSuggesting={isSuggesting}
            searchNotice={searchNotice}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            selectStockForAnalysis={selectStockForAnalysis}
            recentStocks={recentStocks}
            marketStocks={marketStocks}
            selectedStock={selectedStock}
            hasAnalyzed={hasAnalyzed}
            analysisFocusToken={analysisFocusToken}
            screenRef={screenRef}
            addStockToPortfolio={openPortfolioPrompt}
            addStockToWatchlist={addStockToWatchlist}
          />
        )}

        {activeTab === 'watch' && (
          <WatchView
            watchlist={watchlist}
            removeFromWatchlist={removeFromWatchlist}
            setActiveTab={setActiveTab}
            setKlineReturnTab={setKlineReturnTab}
            setSelectedCode={setSelectedCode}
            setQuery={setQuery}
            notificationSettings={notificationSettings}
            alertEvents={alertEvents}
            alertUnreadCount={alertUnreadCount}
            alertMonitorStatus={alertMonitorStatus}
            isAlertCenterOpen={isAlertCenterOpen}
            setIsAlertCenterOpen={setIsAlertCenterOpen}
            updateNotificationSettings={updateNotificationSettings}
            apiStatus={apiStatus}
            dataStatus={dataStatus}
            taskStatus={taskStatus}
            refreshMarketData={refreshMarketData}
            isRefreshingData={isRefreshingData}
            checkAlertEvents={checkAlertEvents}
            isCheckingAlerts={isCheckingAlerts}
            markAllAlertsRead={markAllAlertsRead}
            markAlertRead={markAlertRead}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            key={`${userSummary.profile?.id}-${userSummary.profile?.displayName}-${userSummary.profile?.riskLevel}`}
            userSummary={userSummary}
            portfolio={portfolio}
            watchlist={watchlist}
            apiStatus={apiStatus}
            dataStatus={dataStatus}
            systemStatus={systemStatus}
            isSavingUserProfile={isSavingUserProfile}
            saveUserProfile={saveUserProfile}
            authSession={authSession}
            authNotice={authNotice}
            sendLoginCode={sendLoginCode}
            loginWithPhone={loginWithPhone}
            loginWithWechat={loginWithWechat}
            logoutUser={logoutUser}
            deleteAccount={deleteAccount}
            isDeletingAccount={isDeletingAccount}
            openLegalPanel={setLegalPanel}
          />
        )}

        {activeTab === 'kline' && (
          <KLineView
            setActiveTab={setActiveTab}
            returnTab={klineReturnTab}
            stock={selectedStock}
            candles={klineCandles}
          />
        )}
        </div>
      </section>

      {activeTab !== 'kline' && (
        <nav className="tabbar" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              className={activeTab === tab.id ? 'tab is-active' : 'tab'}
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
            >
              <Icon size={19} />
              <span>{tab.label}</span>
            </button>
          )
        })}
        </nav>
      )}

      {portfolioPrompt && (
        <PortfolioPrompt
          error={portfolioPromptError}
          input={portfolioInput}
          isSubmitting={isSubmittingPortfolio}
          setInput={setPortfolioInput}
          stock={portfolioPrompt}
          onClose={() => {
            setPortfolioPrompt(null)
            setPortfolioPromptError('')
          }}
          onSubmit={submitPortfolioPrompt}
        />
      )}
      {legalPanel && <LegalSheet type={legalPanel} onClose={() => setLegalPanel(null)} />}
    </main>
  )
}

function LoginScreen({
  authNotice,
  sendLoginCode,
  loginWithPhone,
  loginWithWechat,
  openLegalPanel,
}) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark" aria-hidden="true">
            <LogoMark />
          </div>
          <div>
            <p className="caption">股票研究辅助</p>
            <h1>股镜</h1>
          </div>
        </div>

        <div className="login-copy">
          <h2>登录后查看你的持仓和观察池</h2>
          <p>每个账户独立保存股票、提醒和风险偏好。</p>
        </div>

        <AuthPanel
          authSession={{ authenticated: false }}
          authNotice={authNotice}
          sendLoginCode={sendLoginCode}
          loginWithPhone={loginWithPhone}
          loginWithWechat={loginWithWechat}
          logoutUser={() => {}}
        />
        <LegalQuickLinks openLegalPanel={openLegalPanel} />
      </section>
    </main>
  )
}

function HomeView({
  marketStocks,
  recommendedStocks,
  dismissedRecommendationCodes,
  marketOverview,
  watchlist,
  addStockToWatchlist,
  dismissRecommendation,
  analyzeRecommendation,
}) {
  const activeRecommendations = recommendedStocks.filter((stock) => !dismissedRecommendationCodes.includes(stock.code))
  const recommendedStock = activeRecommendations[0]
    ?? [...marketStocks].sort((a, b) => b.performance.month - a.performance.month)[0]
    ?? stocks['600519']
  const recommendationDecision = buildStockDecision(recommendedStock)
  const isWatching = watchlist.includes(recommendedStock.code)
  const recommendationReason = recommendedStock.recommendation?.reason || '按市场强度和趋势排序'

  return (
    <div className="view-stack">
      <MarketOverview marketOverview={marketOverview} />

      <article className={`stock-card recommendation-card tone-${recommendedStock.tone}`}>
        <div className="stock-card__head">
          <div>
            <p className="caption">未来一个月推荐关注</p>
            <h2>{recommendedStock.name}</h2>
            <p className="stock-code">
              {recommendedStock.code} · {recommendedStock.industry}
            </p>
            <StockPriceLine stock={recommendedStock} />
          </div>
          <div className="price-block">
            <strong className={trendClass(recommendedStock.performance.day)}>
              {formatPercent(recommendedStock.performance.day)}
            </strong>
            <span>今日涨跌</span>
          </div>
        </div>

        <div className="score-line recommendation-score">
          <div>
            <span>上涨趋势评分</span>
            <strong>{recommendedStock.score}</strong>
          </div>
          <div className="score-track">
            <span style={{ width: `${recommendedStock.score}%` }} />
          </div>
        </div>
        <div className="recommendation-reason">
          <Sparkles size={15} />
          <span>{recommendationReason}</span>
        </div>

        <div className="recommendation-analysis">
          <div>
            <span>看好理由</span>
            <p>{recommendationDecision.trendView}</p>
          </div>
          <div>
            <span>主要风险</span>
            <p>{recommendationDecision.systemAnalysis}</p>
          </div>
          <div>
            <span>观察点</span>
            <p>当前建议：{recommendationDecision.holdingAdvice}。后续重点看今日涨跌是否延续，以及近一月趋势是否继续改善。</p>
          </div>
        </div>

        <div className="tag-row">
          {recommendedStock.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="recommendation-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={() => addStockToWatchlist(recommendedStock.code)}
            disabled={isWatching}
          >
            <Plus size={17} />
            {isWatching ? '已在观察池' : '加入观察池'}
          </button>
          <button type="button" onClick={() => analyzeRecommendation(recommendedStock)}>
            查看分析
          </button>
          <button type="button" onClick={() => dismissRecommendation(recommendedStock.code)}>
            不感兴趣
          </button>
        </div>
        <p className="recommendation-feedback-note">
          你的操作会用于之后的推荐排序：常看的行业会提高权重，不感兴趣的股票会减少出现。
        </p>
      </article>

      <RiskNotice />
    </div>
  )
}

function PortfolioPrompt({ stock, input, setInput, error, isSubmitting, onSubmit, onClose }) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="portfolio-sheet-title">
      <form className="portfolio-sheet" onSubmit={onSubmit}>
        <div className="sheet-head">
          <div>
            <span>加入持仓</span>
            <h2 id="portfolio-sheet-title">{stock.name}</h2>
            <p>{stock.code} · 当前价 {displayStockPrice(stock)}</p>
          </div>
          <button type="button" onClick={onClose}>取消</button>
        </div>

        <div className="mode-switch" aria-label="持仓输入方式">
          <button
            className={input.mode === 'amount' ? 'is-active' : ''}
            type="button"
            onClick={() => setInput((value) => ({ ...value, mode: 'amount' }))}
          >
            按金额
          </button>
          <button
            className={input.mode === 'shares' ? 'is-active' : ''}
            type="button"
            onClick={() => setInput((value) => ({ ...value, mode: 'shares' }))}
          >
            按股数
          </button>
        </div>

        {input.mode === 'amount' ? (
          <label className="sheet-field">
            <span>持仓金额</span>
            <input
              inputMode="numeric"
              placeholder="10000"
              value={input.amount}
              onChange={(event) =>
                setInput((value) => ({
                  ...value,
                  amount: event.target.value.replace(/[^\d]/g, ''),
                }))
              }
            />
          </label>
        ) : (
          <label className="sheet-field">
            <span>持仓股数</span>
            <input
              inputMode="numeric"
              placeholder="100"
              value={input.shares}
              onChange={(event) =>
                setInput((value) => ({
                  ...value,
                  shares: event.target.value.replace(/[^\d]/g, ''),
                }))
              }
            />
          </label>
        )}

        <label className="sheet-field">
          <span>成本价</span>
          <input
            inputMode="decimal"
            placeholder={hasLivePrice(stock) ? stock.price.replace(/,/g, '') : '手动填写成本价'}
            value={input.costPrice}
            onChange={(event) =>
              setInput((value) => ({
                ...value,
                costPrice: event.target.value.replace(/[^\d.]/g, ''),
              }))
            }
          />
        </label>

        {error && <p className="sheet-error">{error}</p>}

        <button className="sheet-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '正在加入...' : '确认加入持仓'}
        </button>
      </form>
    </div>
  )
}

function PriceChart({ stock }) {
  const klineCandles = stock.klineRows?.length ? stock.klineRows : buildKLineData(stock)
  const hasKline = klineCandles.length > 0
  const points = stock.chart
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const width = 320
  const height = 128
  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((point - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <section className="panel chart-panel">
      <div className="section-title split">
        <div>
          <BarChart3 size={18} />
          <h2>{hasKline ? 'K线走势' : '价格走势'}</h2>
        </div>
        <span>{hasKline ? '日K' : '10 日演示'}</span>
      </div>
      {hasKline ? (
        <>
          <KLineChart stock={stock} candles={klineCandles} />
          <TechnicalLevels candles={klineCandles} />
        </>
      ) : (
        <>
          <svg className="price-chart" viewBox={`0 0 ${width} ${height}`} aria-label={`${stock.name} 价格走势`}>
            <line x1="0" y1="32" x2={width} y2="32" />
            <line x1="0" y1="64" x2={width} y2="64" />
            <line x1="0" y1="96" x2={width} y2="96" />
            <polyline points={coordinates} />
          </svg>
          <div className="chart-range">
            <span>低 {min.toFixed(2)}</span>
            <span>高 {max.toFixed(2)}</span>
          </div>
        </>
      )}
      <StockStatsGrid stock={stock} />
    </section>
  )
}

function StockDecisionPanel({ stock, addStockToPortfolio, addStockToWatchlist }) {
  const monthMove = stock.performance.month
  const decision = buildStockDecision(stock)
  const analysisScore = stock.analysisScore ?? fallbackAnalysisScore(stock)
  const forecast = analysisScore.forecast
  const dataQuality = analysisScore.dataQuality
  const industryModel = analysisScore.industryModel ?? analysisScore.advice?.industryModel
  const compliance = analysisScore.compliance
  const newsImpact = stock.newsImpact

  return (
    <section className="panel decision-panel">
      <div className="section-title split">
        <div>
          <Sparkles size={18} />
          <h2>{stock.name} 分析</h2>
        </div>
        <span>{stock.code}</span>
      </div>

      <div className="decision-actions">
        <button
          className="portfolio-add-action"
          type="button"
          onClick={() => addStockToPortfolio(stock.code)}
        >
          <BriefcaseBusiness size={17} />
          一键加入持仓
        </button>
        <button
          className="watch-add-action"
          type="button"
          onClick={() => addStockToWatchlist(stock.code)}
        >
          <Bell size={17} />
          加入观察池
        </button>
      </div>

      <div className="decision-grid">
        <div>
          <span>持仓建议</span>
          <strong>{decision.holdingAdvice}</strong>
        </div>
        <div>
          <span>近一月走势</span>
          {decision.hasHistory ? (
            <strong className={trendClass(monthMove)}>{formatPercent(monthMove)}</strong>
          ) : (
            <strong>待补充</strong>
          )}
        </div>
      </div>

      <div className="analysis-score-card">
        <div>
          <span>系统评分</span>
          <strong>{analysisScore.total}</strong>
        </div>
        <p>{analysisScore.stance}：{analysisScore.reasons.join('，')}</p>
      </div>

      {forecast && (
        <div className="forecast-card">
          <div className="forecast-card__head">
            <div>
              <span>预测模型 {forecast.version?.replace('v1-', 'v1 ') ?? 'v1'}</span>
              <strong>{forecast.label}</strong>
            </div>
            <div className="forecast-card__meta">
              <em>{forecast.horizon}</em>
              {forecast.confidence && (
                <b>置信度 {forecast.confidence.label}</b>
              )}
            </div>
          </div>
          <div className="forecast-probabilities">
            <div>
              <span>5日偏强概率</span>
              <strong>{forecast.probability5d}%</strong>
            </div>
            <div>
              <span>20日偏强概率</span>
              <strong>{forecast.probability20d}%</strong>
            </div>
            <div>
              <span>波动安全分</span>
              <strong>{forecast.riskScore}</strong>
            </div>
          </div>
          <p>{forecast.stance}</p>
          <details className="analysis-disclosure">
            <summary>
              <span>查看关键价位</span>
              <ChevronRight size={17} />
            </summary>
            <div className="forecast-key-levels">
              <div>
                <span>短期支撑</span>
                <strong>{formatLevelValue(forecast.keyLevels?.support)}</strong>
              </div>
              <div>
                <span>短期压力</span>
                <strong>{formatLevelValue(forecast.keyLevels?.resistance)}</strong>
              </div>
              <div>
                <span>距压力</span>
                <strong>{formatLevelValue(forecast.keyLevels?.distanceToResistance, '%')}</strong>
              </div>
            </div>
          </details>
          <details className="analysis-disclosure">
            <summary>
              <span>查看观察点和风险</span>
              <ChevronRight size={17} />
            </summary>
            {forecast.watchPoints?.length > 0 && (
              <div className="forecast-note-list">
                <span>接下来重点看</span>
                {forecast.watchPoints.slice(0, 2).map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </div>
            )}
            {forecast.riskWarnings?.length > 0 && (
              <div className="forecast-risk-list">
                <span>风险提醒</span>
                {forecast.riskWarnings.slice(0, 2).map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
          </details>
          <details className="analysis-disclosure">
            <summary>
              <span>查看模型因子</span>
              <ChevronRight size={17} />
            </summary>
            <div className="forecast-factor-list">
              {forecast.factors?.slice(0, 4).map((factor) => (
                <div key={factor.name}>
                  <span>{factor.name}</span>
                  <i>
                    <b style={{ width: `${factor.score}%` }} />
                  </i>
                  <em>{factor.score}</em>
                </div>
              ))}
            </div>
          </details>
          <small>{forecast.disclaimer}</small>
        </div>
      )}

      <details className="analysis-disclosure">
        <summary>
          <span>查看评分明细</span>
          <ChevronRight size={17} />
        </summary>
        <div className="analysis-factor-list">
          {analysisScore.factors.slice(0, 4).map((factor) => (
            <div key={factor.name}>
              <span>{factor.name}</span>
              <strong>{factor.score}</strong>
              <i>
                <b style={{ width: `${factor.score}%` }} />
              </i>
              <p>{factor.text}</p>
            </div>
          ))}
        </div>
      </details>

      {dataQuality && (
        <details className="analysis-disclosure">
          <summary>
            <span>查看数据质量</span>
            <strong>{dataQuality.label}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="quality-grid">
            <div>
              <span>实时行情</span>
              <strong>{dataQuality.quote}</strong>
            </div>
            <div>
              <span>K线数据</span>
              <strong>{dataQuality.history}</strong>
            </div>
            <div>
              <span>基本面</span>
              <strong>{dataQuality.fundamental}</strong>
            </div>
          </div>
          <div className="forecast-note-list">
            <span>数据提醒</span>
            {dataQuality.warnings?.slice(0, 3).map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </details>
      )}

      {industryModel && (
        <details className="analysis-disclosure">
          <summary>
            <span>查看行业模型</span>
            <strong>{industryModel.name}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="model-note">
            <strong>{industryModel.name}</strong>
            <p>{industryModel.focus}</p>
          </div>
        </details>
      )}

      {compliance && (
        <details className="analysis-disclosure">
          <summary>
            <span>查看合规说明</span>
            <ChevronRight size={17} />
          </summary>
          <div className="forecast-risk-list">
            <span>{compliance.title}</span>
            <p>{compliance.shortText}</p>
            {compliance.items?.slice(0, 3).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </details>
      )}

      {decision.rules?.length ? (
        <details className="analysis-disclosure">
          <summary>
            <span>查看持仓规则</span>
            <ChevronRight size={17} />
          </summary>
          <div className="advice-rule-list">
            {decision.rules.slice(0, 5).map((rule) => (
              <article key={rule.name}>
                <div>
                  <span>{rule.name}</span>
                  <strong>{rule.conclusion}</strong>
                </div>
                <p>{rule.reason}</p>
                <small>{rule.risk}</small>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      <details className="analysis-disclosure">
        <summary>
          <span>查看走势和系统分析</span>
          <ChevronRight size={17} />
        </summary>
        <div className="decision-copy">
          <span>未来走势推断</span>
          <p>{decision.trendView}</p>
        </div>
        <div className="decision-copy">
          <span>系统分析</span>
          <p>{decision.systemAnalysis}</p>
        </div>
      </details>

      {newsImpact?.items?.length ? (
        <details className="analysis-disclosure">
          <summary>
            <span>查看新闻影响</span>
            <strong>{newsImpact.stance}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="news-impact-panel">
            {newsImpact.items.slice(0, 3).map((item) => (
              <article className={`news-impact-item tone-${item.tone}`} key={`${item.title}-${item.publishedAt}`}>
                <b>{item.category}</b>
                <p>{item.title}</p>
                <small>{item.source} · {item.publishedAt}</small>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}

function MarketOverview({ marketOverview }) {
  const [activeMarket, setActiveMarket] = useState('cn')
  const globalMarkets = marketOverview.globalMarkets?.length
    ? marketOverview.globalMarkets
    : marketOverviews.cn.globalMarkets
  const marketDetails = marketOverview.marketDetails ?? marketOverviews.cn.marketDetails
  const selectedMarket = marketDetails[activeMarket] ?? marketDetails.cn
  const selectedBreadth = activeMarket === 'cn'
    ? marketOverview.breadth
    : selectedMarket.breadth
      ?? Number.parseFloat(globalMarkets.find((market) => market.id === activeMarket)?.value)
      ?? 0

  return (
    <section className="market-overview">
      <div className="overview-head">
        <div>
          <p className="caption">市场概览</p>
          <h2>市场监看</h2>
        </div>
        <span>更新 {marketOverview.updated}</span>
      </div>

      <div className="global-market-strip" aria-label="全球市场监看">
        {globalMarkets.map((market) => (
          <button
            className={[
              market.id === 'cn' ? 'is-primary' : '',
              market.id === activeMarket ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            key={market.id}
            type="button"
            onClick={() => setActiveMarket(market.id)}
          >
            <span>{market.name}</span>
            <strong>{market.value}</strong>
            <em className={market.change.startsWith('-') ? 'is-down' : 'is-up'}>
              {market.change}
            </em>
            <small>{market.metric} · {market.mood}</small>
            <small>点按查看细节</small>
          </button>
        ))}
      </div>

      <div className="breadth-meter">
        <div>
          <strong>{selectedBreadth}%</strong>
          <span>{selectedMarket.name}上涨占比</span>
        </div>
        <div className="breadth-track">
          <i style={{ width: `${selectedBreadth}%` }} />
        </div>
      </div>

      {activeMarket !== 'cn' && (
        <div className="market-analysis-card">
          <span>{selectedMarket.name}分析</span>
          <p>{selectedMarket.summary}</p>
        </div>
      )}

      <p className="overview-summary">{activeMarket === 'cn' ? marketOverview.summary : selectedMarket.summary}</p>

      <details className="compact-details">
        <summary>{selectedMarket.name}细节</summary>
        <div className="index-strip" aria-label="主要指数">
          {selectedMarket.indices.map((index) => (
            <div key={index.name}>
              <span>{index.name}</span>
              <strong>{index.value}</strong>
              <em className={index.change.startsWith('-') ? 'is-down' : 'is-up'}>
                {index.change}
              </em>
            </div>
          ))}
        </div>

        <div className="sector-panel">
          <div className="section-title compact">
            <TrendingUp size={17} />
            <h3>强弱行业</h3>
          </div>
          <div className="sector-list">
            {selectedMarket.sectors.map((sector) => (
              <div key={sector.name}>
                <span>
                  {sector.name}
                  {sector.count ? <em>{sector.count}只</em> : null}
                </span>
                <strong className={sector.tone === 'down' ? 'is-down' : 'is-up'}>
                  {sector.change}
                </strong>
                {sector.leaders?.length ? (
                  <small>
                    {sector.leaders.map((leader) => leader.name).join('、')}
                  </small>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </details>
    </section>
  )
}

function DiscoverView({
  query,
  setQuery,
  runSearch,
  searchSuggestions,
  isSuggesting,
  searchNotice,
  isSearchFocused,
  setIsSearchFocused,
  selectStockForAnalysis,
  recentStocks,
  marketStocks,
  selectedStock,
  hasAnalyzed,
  analysisFocusToken,
  screenRef,
  addStockToPortfolio,
  addStockToWatchlist,
}) {
  const pricedMarketStocks = marketStocks.filter(hasLivePrice)
  const displayMarketStocks = pricedMarketStocks.length >= 10 ? pricedMarketStocks : marketStocks
  const rankedStocks = [...displayMarketStocks].sort(
    (a, b) => b.performance.day - a.performance.day,
  )
  const topGainers = rankedStocks.slice(0, 5)
  const topLosers = [...displayMarketStocks]
    .sort((a, b) => a.performance.day - b.performance.day)
    .slice(0, 5)
  const maxMove = Math.max(
    ...[...topGainers, ...topLosers].map((stock) => Math.abs(stock.performance.day)),
    1,
  )
  const leader = rankedStocks[0]
  const focusPool = [
    ...pricedMarketStocks,
    ...Object.values(stocks).filter((stock) => stock.market === 'cn' && hasLivePrice(stock)),
  ]
  const focusStocks = Array.from(new Map(focusPool.map((stock) => [stock.code, stock])).values())
    .sort((a, b) => {
      const aScore = a.performance.day * 1.6 + a.performance.month * 0.8 + a.score / 20
      const bScore = b.performance.day * 1.6 + b.performance.month * 0.8 + b.score / 20
      return bScore - aScore
    })
    .slice(0, 10)
  const tickerStocks = focusStocks.length ? [...focusStocks, ...focusStocks, ...focusStocks] : []
  const tickerRef = useRef(null)
  const analysisRef = useRef(null)
  const isTickerPausedRef = useRef(false)
  const tickerResumeTimerRef = useRef(null)
  const tickerKey = focusStocks.map((stock) => stock.code).join(',')
  const chartStock = marketStocks.some((stock) => stock.code === selectedStock.code)
    ? selectedStock
    : leader
  const showSuggestions = isSearchFocused && query.trim() && searchSuggestions.length > 0

  useEffect(() => {
    if (!analysisFocusToken || !analysisRef.current) return
    const frameId = window.requestAnimationFrame(() => {
      const screen = screenRef?.current ?? analysisRef.current?.closest('.screen')
      if (!screen || !analysisRef.current) return
      const screenRect = screen.getBoundingClientRect()
      const targetRect = analysisRef.current.getBoundingClientRect()
      const targetTop = screen.scrollTop + targetRect.top - screenRect.top - 12
      screen.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [analysisFocusToken, screenRef])

  useEffect(() => {
    const ticker = tickerRef.current
    if (!ticker || focusStocks.length === 0) return undefined

    let frameId = 0
    let lastTime = 0
    let scrollPosition = ticker.scrollLeft

    function getSegmentWidth() {
      return ticker.scrollWidth / 3
    }

    function normalizePosition(position) {
      const segmentWidth = getSegmentWidth()
      if (!segmentWidth) return position
      if (position < segmentWidth * 0.45) return position + segmentWidth
      if (position > segmentWidth * 1.55) return position - segmentWidth
      return position
    }

    function setTickerPosition(position) {
      scrollPosition = normalizePosition(position)
      ticker.scrollLeft = scrollPosition
    }

    function syncManualScroll() {
      const segmentWidth = ticker.scrollWidth / 3
      if (!segmentWidth) return
      scrollPosition = ticker.scrollLeft
      if (scrollPosition < segmentWidth * 0.2 || scrollPosition > segmentWidth * 1.8) {
        setTickerPosition(scrollPosition)
      }
    }

    window.requestAnimationFrame(() => {
      setTickerPosition(getSegmentWidth())
    })

    function step(time) {
      if (!lastTime) lastTime = time
      const delta = Math.min(time - lastTime, 80)
      lastTime = time
      if (!isTickerPausedRef.current) {
        setTickerPosition(scrollPosition + delta * 0.075)
      }
      frameId = window.requestAnimationFrame(step)
    }

    ticker.addEventListener('scroll', syncManualScroll, { passive: true })
    frameId = window.requestAnimationFrame(step)
    return () => {
      window.cancelAnimationFrame(frameId)
      ticker.removeEventListener('scroll', syncManualScroll)
      window.clearTimeout(tickerResumeTimerRef.current)
    }
  }, [tickerKey, focusStocks.length])

  function pauseFocusTicker() {
    isTickerPausedRef.current = true
    window.clearTimeout(tickerResumeTimerRef.current)
  }

  function resumeFocusTicker() {
    window.clearTimeout(tickerResumeTimerRef.current)
    tickerResumeTimerRef.current = window.setTimeout(() => {
      isTickerPausedRef.current = false
    }, 1200)
  }

  return (
    <div className="view-stack">
      <section className="market-hero">
        <div className="market-hero__focus" aria-label="今日值得关注股票">
          <div className="market-hero__head">
            <span>今日值得关注</span>
            <em>异动滚动屏</em>
          </div>
          <div className="market-board-status" aria-hidden="true">
            <span>LIVE</span>
            <b>10 只股票循环监看，按涨幅、趋势和研究评分排序</b>
          </div>
          <div
            className="focus-ticker"
            onMouseDown={pauseFocusTicker}
            onMouseLeave={resumeFocusTicker}
            onMouseUp={resumeFocusTicker}
            onTouchEnd={resumeFocusTicker}
            onTouchStart={pauseFocusTicker}
          >
            <div
              className="focus-ticker__viewport"
              ref={tickerRef}
            >
            <div className="focus-ticker__track">
            {tickerStocks.map((stock, index) => (
              <button
                key={`${stock.code}-${index}`}
                type="button"
                onClick={() => selectStockForAnalysis(stock, stock.name)}
              >
                <div>
                  <strong>{stock.code}</strong>
                  <b>{stock.name}</b>
                </div>
                <em className={trendClass(stock.performance.day)}>
                  {displayStockMove(stock)}
                </em>
                <p>
                  <span>现价 {displayStockPrice(stock)}</span>
                  <span>{stock.performance.day >= 0 ? '今日上涨' : '今日下跌'}</span>
                </p>
              </button>
            ))}
            </div>
            </div>
          </div>
          <small>触碰可暂停并手动翻阅，点击股票进入分析</small>
        </div>
      </section>

      <form
        className="search-panel"
        onSubmit={(event) => {
          runSearch(event)
        }}
      >
        <label htmlFor="stock-code">查一只股票</label>
        <div className="search-row">
          <Search size={18} />
          <input
            id="stock-code"
            inputMode="text"
            placeholder="输入代码、企业名称或简称"
            value={query}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setIsSearchFocused(false), 120)
            }}
          />
          <button type="submit">分析</button>
        </div>
        {searchNotice && <p className="search-notice">{searchNotice}</p>}
        {showSuggestions && (
          <div className="suggestion-panel" role="listbox" aria-label="股票搜索建议">
            <div className="suggestion-panel__head">
              <span>相关股票</span>
              {isSuggesting && <em>搜索中</em>}
            </div>
            {searchSuggestions.map((stock) => (
              <button
                key={stock.code}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectStockForAnalysis(stock, stock.name)}
              >
                <Search size={16} />
                <div>
                  <strong>{stock.name}</strong>
                  <span>{stock.code} · {stock.industry}</span>
                </div>
                <em className={trendClass(stock.performance.day)}>
                  {displayStockMove(stock)}
                </em>
              </button>
            ))}
          </div>
        )}
        <p className="quick-codes-title">经常查找</p>
        <div className="quick-codes" aria-label="经常查找的股票">
          {recentStocks.map((stock) => (
            <button
              key={stock.code}
              type="button"
              onClick={() => selectStockForAnalysis(stock, stock.name)}
            >
              {stock.name}
            </button>
          ))}
        </div>
      </form>

      {hasAnalyzed && (
        <div className="analysis-results" ref={analysisRef}>
          <PriceChart stock={chartStock} />
          <StockDecisionPanel
            stock={chartStock}
            addStockToPortfolio={addStockToPortfolio}
            addStockToWatchlist={addStockToWatchlist}
          />
        </div>
      )}

      <section className="panel">
        <div className="section-title">
          <BarChart3 size={18} />
          <h2>最新涨跌榜</h2>
        </div>
        <div className="mover-list">
          <MoverGroup
            label="涨幅前 5"
            maxMove={maxMove}
            onSelect={selectStockForAnalysis}
            stocks={topGainers}
          />
          <MoverGroup
            label="跌幅前 5"
            maxMove={maxMove}
            onSelect={selectStockForAnalysis}
            stocks={topLosers}
          />
        </div>
      </section>

      <RiskNotice />
    </div>
  )
}

function MoverGroup({ label, stocks, maxMove, onSelect }) {
  return (
    <div className="mover-group">
      <span>{label}</span>
      {stocks.map((stock) => {
        const move = stock.performance.day
        const width = Math.max((Math.abs(move) / maxMove) * 100, 8)
        return (
          <button
            className="mover-row"
            key={stock.code}
            type="button"
            onClick={() => onSelect(stock)}
          >
            <div className="mover-info">
              <strong>{stock.name}</strong>
              <span>{stock.code} · {hasLivePrice(stock) ? `¥${stock.price}/股` : '行情待同步'}</span>
            </div>
            <Sparkline points={stock.sparkline} positive={move >= 0} />
            <div className={move >= 0 ? 'mover-change is-up' : 'mover-change is-down'}>
              <span>{formatPercent(move)}</span>
              <i style={{ width: `${width}%` }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Sparkline({ points, positive }) {
  const width = 74
  const height = 28
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((point - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className={positive ? 'sparkline is-up' : 'sparkline is-down'} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={coordinates} />
    </svg>
  )
}

function buildKLineData(stock) {
  return stock.chart.map((close, index, values) => {
    const previous = values[index - 1] ?? close * 0.985
    const open = index === 0 ? previous : values[index - 1]
    const swing = Math.max(close * 0.012, 0.08)
    const high = Math.max(open, close) + swing * (index % 3 === 0 ? 1.2 : 0.72)
    const low = Math.min(open, close) - swing * (index % 2 === 0 ? 0.9 : 0.58)
    return {
      date: `D${index + 1}`,
      open,
      close,
      high,
      low,
      volume: 0,
    }
  })
}

function movingAverage(candles, windowSize) {
  return candles.map((_, index) => {
    if (index + 1 < windowSize) return null
    const slice = candles.slice(index + 1 - windowSize, index + 1)
    return slice.reduce((sum, item) => sum + item.close, 0) / windowSize
  })
}

function linePoints(values, xFor, yFor) {
  return values
    .map((value, index) => (value === null ? null : `${xFor(index).toFixed(1)},${yFor(value).toFixed(1)}`))
    .filter(Boolean)
    .join(' ')
}

function buildTechnicalLevels(candles) {
  const rows = candles?.length ? candles : []
  if (!rows.length) {
    return {
      support: null,
      resistance: null,
      volumeSignal: '成交量待补充',
      trendSignal: '均线待补充',
    }
  }

  const recent = rows.slice(-20)
  const support = Math.min(...recent.map((item) => item.low))
  const resistance = Math.max(...recent.map((item) => item.high))
  const volumes = recent.map((item) => Number(item.volume ?? 0)).filter((value) => value > 0)
  const lastVolume = Number(rows.at(-1)?.volume ?? 0)
  const averageVolume = volumes.length ? volumes.reduce((sum, value) => sum + value, 0) / volumes.length : 0
  const ma5 = movingAverage(rows, 5).at(-1)
  const ma20 = movingAverage(rows, 20).at(-1)

  return {
    support,
    resistance,
    volumeSignal: averageVolume && lastVolume
      ? lastVolume > averageVolume * 1.25
        ? '成交量放大'
        : lastVolume < averageVolume * 0.75
          ? '成交量收缩'
          : '成交量正常'
      : '成交量待补充',
    trendSignal: ma5 && ma20
      ? ma5 >= ma20
        ? '短线在中期均线上方'
        : '短线仍在中期均线下方'
      : '均线待补充',
  }
}

function KLineChart({ stock, candles: backendCandles }) {
  const candles = backendCandles?.length ? backendCandles : buildKLineData(stock)
  const width = 340
  const height = 270
  const padding = { top: 20, right: 14, bottom: 30, left: 14 }
  const min = Math.min(...candles.map((item) => item.low))
  const max = Math.max(...candles.map((item) => item.high))
  const range = max - min || 1
  const plotWidth = width - padding.left - padding.right
  const priceHeight = 170
  const volumeTop = padding.top + priceHeight + 16
  const volumeHeight = 46
  const step = plotWidth / candles.length
  const candleWidth = Math.min(15, step * 0.52)
  const yFor = (value) => padding.top + (max - value) / range * priceHeight
  const xFor = (index) => padding.left + step * index + step / 2
  const maxVolume = Math.max(...candles.map((item) => Number(item.volume ?? 0)), 1)
  const ma5 = movingAverage(candles, 5)
  const ma10 = movingAverage(candles, 10)
  const ma20 = movingAverage(candles, 20)

  return (
    <svg className="kline-chart" viewBox={`0 0 ${width} ${height}`} aria-label={`${stock.name} K线图`}>
      <line x1={padding.left} y1={padding.top + priceHeight * 0.25} x2={width - padding.right} y2={padding.top + priceHeight * 0.25} />
      <line x1={padding.left} y1={padding.top + priceHeight * 0.5} x2={width - padding.right} y2={padding.top + priceHeight * 0.5} />
      <line x1={padding.left} y1={padding.top + priceHeight * 0.75} x2={width - padding.right} y2={padding.top + priceHeight * 0.75} />
      {candles.map((item, index) => {
        const x = xFor(index)
        const isUp = item.close >= item.open
        const top = yFor(Math.max(item.open, item.close))
        const bodyHeight = Math.max(Math.abs(yFor(item.open) - yFor(item.close)), 3)
        const volume = Number(item.volume ?? 0)
        const volumeBarHeight = maxVolume ? Math.max((volume / maxVolume) * volumeHeight, volume ? 2 : 0) : 0
        return (
          <g className={isUp ? 'k-candle is-up' : 'k-candle is-down'} key={item.date}>
            <line x1={x} y1={yFor(item.high)} x2={x} y2={yFor(item.low)} />
            <rect x={x - candleWidth / 2} y={top} width={candleWidth} height={bodyHeight} rx="2" />
            <rect
              className="volume-bar"
              x={x - candleWidth / 2}
              y={volumeTop + volumeHeight - volumeBarHeight}
              width={candleWidth}
              height={volumeBarHeight}
              rx="1.8"
            />
          </g>
        )
      })}
      <polyline className="ma-line ma5" points={linePoints(ma5, xFor, yFor)} />
      <polyline className="ma-line ma10" points={linePoints(ma10, xFor, yFor)} />
      <polyline className="ma-line ma20" points={linePoints(ma20, xFor, yFor)} />
      <line className="volume-axis" x1={padding.left} y1={volumeTop + volumeHeight} x2={width - padding.right} y2={volumeTop + volumeHeight} />
      <text className="ma-label ma5" x={width - padding.right - 110} y={32}>MA5</text>
      <text className="ma-label ma10" x={width - padding.right - 72} y={32}>MA10</text>
      <text className="ma-label ma20" x={width - padding.right - 30} y={32}>MA20</text>
      <text x={padding.left} y={volumeTop + volumeHeight + 11}>{candles[0]?.date}</text>
      <text x={width - padding.right - 52} y={volumeTop + volumeHeight + 11}>{candles.at(-1)?.date}</text>
      <text x={padding.left} y={14}>高 {max.toFixed(2)}</text>
      <text x={width - padding.right - 58} y={14}>低 {min.toFixed(2)}</text>
    </svg>
  )
}

function TechnicalLevels({ candles }) {
  const levels = buildTechnicalLevels(candles)
  return (
    <div className="technical-levels" aria-label="技术位提示">
      <div>
        <span>支撑位</span>
        <strong>{formatStatValue(levels.support)}</strong>
      </div>
      <div>
        <span>压力位</span>
        <strong>{formatStatValue(levels.resistance)}</strong>
      </div>
      <p>{levels.trendSignal}，{levels.volumeSignal}。</p>
    </div>
  )
}

function StockStatsGrid({ stock, candles = null }) {
  const stats = buildStockStats(stock, candles)

  return (
    <div className="stock-stats-grid" aria-label={`${stock.name}关键行情数据`}>
      {stats.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{formatStatValue(value)}</strong>
        </div>
      ))}
    </div>
  )
}

function KLineView({ stock, setActiveTab, returnTab, candles }) {
  const displayCandles = candles?.length ? candles : stock.klineRows?.length ? stock.klineRows : buildKLineData(stock)
  const dataQuality = stock.dataQuality ?? stock.analysisScore?.dataQuality
  const sourceTrust = stock.sourceTrust ?? dataQuality?.sourceTrust
  const quoteSource = stock.quoteStats?.source ?? stock.quote?.source ?? '待同步'
  const klineSource = stock.klineSource ?? stock.historyProvider ?? (stock.dataCoverage?.history ? '历史K线' : '待补充')
  return (
    <div className="view-stack kline-view">
      <button className="back-button" type="button" onClick={() => setActiveTab(returnTab)}>
        <ChevronRight size={17} />
        返回{returnTab === 'portfolio' ? '持仓' : '观察'}
      </button>

      <section className="panel kline-panel">
        <div className="section-title split">
          <div>
            <BarChart3 size={18} />
            <h2>{stock.name} K线图</h2>
          </div>
          <span>{stock.code}</span>
        </div>
        <div className="kline-meta">
          <div>
            <span>今日涨跌</span>
            <strong className={trendClass(stock.performance.day)}>
              {displayStockMove(stock)}
            </strong>
          </div>
          <div>
            <span>当前价</span>
            <strong>{displayStockPrice(stock)}</strong>
          </div>
        </div>
        <KLineChart stock={stock} candles={displayCandles} />
        <TechnicalLevels candles={displayCandles} />
        <StockStatsGrid stock={stock} candles={displayCandles} />
        <div className="data-source-strip">
          <div>
            <span>实时行情</span>
            <strong>{quoteSource}</strong>
          </div>
          <div>
            <span>K线来源</span>
            <strong>{klineSource}</strong>
          </div>
          <div>
            <span>K线数量</span>
            <strong>{displayCandles.length} 根</strong>
          </div>
          <div>
            <span>数据质量</span>
            <strong>{dataQuality?.label ?? sourceTrust?.label ?? '检查中'}</strong>
          </div>
        </div>
        <p>
          当前页会优先显示实时/准实时价格，再结合日K、成交量、市值和数据质量生成分析。
          免费公开行情源可能有延迟，关键交易前仍需要自行核验。
        </p>
      </section>
    </div>
  )
}

function PortfolioView({
  portfolio,
  concentration,
  totalAmount,
  portfolioInsights,
  adviceHistory,
  loadAdviceHistory,
  backtests,
  loadBacktests,
  stockCatalog,
  draft,
  setDraft,
  addHolding,
  removeHolding,
  setActiveTab,
  setKlineReturnTab,
  setSelectedCode,
  setQuery,
}) {
  const topHolding = portfolio.reduce((top, item) => ((item.marketValue ?? item.amount) > (top.marketValue ?? top.amount) ? item : top), portfolio[0])
  const portfolioDayGain = portfolio.reduce((sum, item) => sum + (item.dayGain ?? 0), 0)
  const totalCost = portfolio.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const totalGain = portfolio.reduce((sum, item) => sum + (item.totalGain ?? 0), 0)
  const totalGainRate = totalCost ? (totalGain / totalCost) * 100 : 0
  const healthScore = Math.max(42, 92 - concentration.ratio + Math.round(portfolioDayGain / 1000))
  const portfolioAdvice = buildPortfolioAdvice(portfolio, concentration, portfolioDayGain)
  const holdingSuggestions = draft.code.trim()
    ? localStockSuggestions(draft.code, stockCatalog, 5)
    : []
  const insightActions = portfolioInsights?.actionItems ?? []
  const recentTransactions = portfolioInsights?.transactionStats?.latest ?? []
  const riskEngine = portfolioInsights?.riskEngine
  const transactionLabels = {
    buy: '买入',
    sell: '减仓',
    adjust: '修改',
    remove: '移出',
  }

  return (
    <div className="view-stack">
      <section className="portfolio-summary">
        <p className="caption">模拟持仓</p>
        <strong>{currency(totalAmount)}</strong>
        <span>
          今日盈亏{' '}
          <em className={portfolioDayGain >= 0 ? 'is-up' : 'is-down'}>
            {currency(portfolioDayGain)}
          </em>
          {' '}· 累计盈亏{' '}
          <em className={totalGain >= 0 ? 'is-up' : 'is-down'}>
            {currency(totalGain)} / {formatPercent(totalGainRate)}
          </em>
        </span>
      </section>

      <section className="health-grid">
        <div>
          <span>组合风险评分</span>
          <strong>{healthScore}</strong>
        </div>
        <div>
          <span>最大持仓</span>
          <strong>{topHolding?.name ?? '无'}</strong>
        </div>
        <div>
          <span>持仓成本</span>
          <strong>{currency(totalCost)}</strong>
        </div>
      </section>

      <section className="health-grid">
        <div>
          <span>累计盈亏</span>
          <strong className={totalGain >= 0 ? 'is-up' : 'is-down'}>
            {currency(totalGain)}
          </strong>
        </div>
        <div>
          <span>累计收益率</span>
          <strong className={totalGainRate >= 0 ? 'is-up' : 'is-down'}>
            {formatPercent(totalGainRate)}
          </strong>
        </div>
        <div>
          <span>今日盈亏</span>
          <strong className={portfolioDayGain >= 0 ? 'is-up' : 'is-down'}>
            {currency(portfolioDayGain)}
          </strong>
        </div>
      </section>

      <section className="panel portfolio-insight-card">
        <div className="section-title split">
          <div>
            <ShieldAlert size={18} />
            <h2>组合诊断</h2>
          </div>
          <span>{portfolioInsights?.riskLabel ?? '等待同步'}</span>
        </div>
        <div className="insight-score">
          <strong>{portfolioInsights?.riskScore ?? healthScore}</strong>
          <span>风险评分</span>
          <em>
            {portfolioInsights?.concentration?.topIndustry ?? concentration.industry}
            {' '}占比{' '}
            {Math.round(portfolioInsights?.concentration?.topRatio ?? concentration.ratio)}%
          </em>
        </div>
        <div className="insight-actions">
          {(insightActions.length ? insightActions : portfolioAdvice.slice(0, 2).map((text) => ({ title: '持仓建议', text }))).map((item) => (
            <div key={`${item.title}-${item.text}`}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {riskEngine && (
        <section className="panel portfolio-risk-engine">
          <div className="section-title split">
            <div>
              <BarChart3 size={18} />
              <h2>组合风险引擎</h2>
            </div>
            <span>{riskEngine.version}</span>
          </div>
          <div className="risk-engine-grid">
            <div>
              <span>分散度</span>
              <strong>{riskEngine.diversificationScore}</strong>
            </div>
            <div>
              <span>估算回撤</span>
              <strong>{riskEngine.estimatedMaxDrawdown}%</strong>
            </div>
            <div>
              <span>相关性</span>
              <strong>{riskEngine.correlationLevel}</strong>
            </div>
          </div>
          <div className="risk-engine-notes">
            {riskEngine.notes?.slice(0, 3).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>
      )}

      <details
        className="panel model-performance-panel"
        onToggle={(event) => {
          if (event.currentTarget.open) loadBacktests()
        }}
      >
        <summary>
          <span>
            <BarChart3 size={18} />
            模型表现
          </span>
          <em>
            {backtests.summary?.hitRate !== null && backtests.summary?.hitRate !== undefined
              ? `命中率 ${backtests.summary.hitRate}%`
              : '点开查看'}
          </em>
        </summary>
        <ModelPerformanceView backtests={backtests} />
      </details>

      <section className="panel">
        <div className="section-title">
          <BarChart3 size={18} />
          <h2>持仓分类分布</h2>
        </div>
        <div className="risk-band">
          <div>
            <span>最大分类占比</span>
            <strong>{concentration.ratio}%</strong>
          </div>
          <p>
            {concentration.industry} 是当前占比最高的分类。
          </p>
        </div>
        <div className="holding-advice">
          <span>持仓建议</span>
          {portfolioAdvice.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
        <div className="industry-bars">
          {concentration.entries.map(([industry, amount]) => (
            <div key={industry}>
              <span>{industry}</span>
              <div>
                <i style={{ width: `${(amount / totalAmount) * 100}%` }} />
              </div>
              <em>{Math.round((amount / totalAmount) * 100)}%</em>
            </div>
          ))}
        </div>
      </section>

      <details className="panel transaction-panel">
        <summary>
          <span>
            <BriefcaseBusiness size={18} />
            交易记录
          </span>
          <em>{recentTransactions.length ? `最近 ${recentTransactions.length} 条` : '暂无记录'}</em>
        </summary>
        {recentTransactions.length ? (
          <div className="transaction-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id}>
                <span>{transactionLabels[transaction.action] ?? transaction.action}</span>
                <strong>{transaction.name}</strong>
                <em>{transaction.shares} 股 · {currency(transaction.amount)}</em>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-empty">新增、减仓或修改成本后会显示在这里。</div>
        )}
      </details>

      <section className="panel holding-add-panel">
        <div className="section-title">
          <Plus size={18} />
          <h2>添加持仓</h2>
        </div>
        <form className="holding-form" onSubmit={addHolding}>
          <input
            inputMode="text"
            maxLength="32"
            placeholder="代码或企业名称"
            value={draft.code}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                code: event.target.value,
              }))
            }
          />
          <input
            inputMode="numeric"
            placeholder="买入金额"
            value={draft.amount}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                amount: event.target.value.replace(/[^\d]/g, ''),
              }))
            }
          />
          <button type="submit">添加</button>
        </form>
        {holdingSuggestions.length > 0 && (
          <div className="suggestion-panel holding-suggestions" role="listbox" aria-label="添加持仓股票建议">
            <div className="suggestion-panel__head">
              <span>相关股票</span>
            </div>
            {holdingSuggestions.map((stock) => (
              <button
                key={stock.code}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  setDraft((value) => ({
                    ...value,
                    code: stock.name,
                  }))
                }
              >
                <Search size={16} />
                <div>
                  <strong>{stock.name}</strong>
                  <span>{stock.code} · {stock.industry}</span>
                </div>
                <em className={trendClass(stock.performance.day)}>
                  {displayStockMove(stock)}
                </em>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="holding-list" aria-label="持仓列表">
        {portfolio.map((item) => (
          <article className="holding-row" key={item.code}>
            <button
              type="button"
              onClick={() => {
                setSelectedCode(item.code)
                setQuery(item.name)
                setKlineReturnTab('portfolio')
                setActiveTab('kline')
              }}
            >
              <strong>{item.name}</strong>
              <span>
                {item.code} · {item.industry}
              </span>
              {stocks[item.code] && <StockPriceLine stock={stocks[item.code]} compact />}
            </button>
            <div className="holding-values">
              <em>{currency(item.marketValue ?? item.amount)}</em>
              <span>{item.shares} 股 · 仓位 {item.positionRatio?.toFixed?.(1) ?? item.positionRatio}%</span>
              <strong className={(item.totalGain ?? 0) >= 0 ? 'is-up' : 'is-down'}>
                {currency(item.totalGain ?? 0)} / {formatPercent(item.totalGainRate ?? 0)}
              </strong>
              <button
                className="ghost-icon"
                type="button"
                aria-label={`删除 ${item.name}`}
                onClick={() => removeHolding(item.code)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="holding-detail-line">
              <span>成本 {formatStatValue(item.costPrice)}</span>
              <span>现价 {formatStatValue(item.currentPrice)}</span>
              <span className={(item.dayGain ?? 0) >= 0 ? 'is-up' : 'is-down'}>
                今日 {currency(item.dayGain ?? 0)}
              </span>
            </div>
            <p className="holding-row-advice">{item.positionAdvice}</p>
            {item.adviceEngine?.action && (
              <div className="holding-action-panel">
                <div>
                  <span>系统动作</span>
                  <strong>{item.adviceEngine.action.label}</strong>
                </div>
                <p>{item.adviceEngine.action.reason}</p>
                <div className="holding-action-meta">
                  <span>{item.adviceEngine.riskProfile?.level ?? '用户'}型</span>
                  <span>建议仓位 {item.adviceEngine.action.targetPosition}</span>
                </div>
                {item.adviceEngine.nextActions?.length > 0 && (
                  <details className="holding-action-detail">
                    <summary>
                      <span>查看下一步</span>
                      <ChevronRight size={16} />
                    </summary>
                    <ul>
                      {item.adviceEngine.nextActions.slice(0, 2).map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <details
                  className="holding-action-detail advice-history-detail"
                  onToggle={(event) => {
                    if (event.currentTarget.open) loadAdviceHistory(item.code)
                  }}
                >
                  <summary>
                    <span>查看建议历史</span>
                    <ChevronRight size={16} />
                  </summary>
                  <AdviceHistoryList history={adviceHistory[item.code]} />
                </details>
              </div>
            )}
          </article>
        ))}
      </section>

      <RiskNotice />
    </div>
  )
}

function AdviceHistoryList({ history }) {
  if (!history || history.status === 'loading') {
    return <div className="advice-history-empty">正在读取建议历史</div>
  }
  if (history.status === 'error') {
    return <div className="advice-history-empty">暂时无法读取建议历史</div>
  }
  if (!history.items?.length) {
    return <div className="advice-history-empty">暂无建议历史</div>
  }

  return (
    <div className="advice-history-list">
      {history.items.slice(0, 3).map((entry) => (
        <div key={entry.id}>
          <span>{entry.createdAt}</span>
          <strong>{entry.actionLabel}</strong>
          <em>
            评分 {entry.score} · 仓位 {formatLevelValue(entry.positionRatio, '%')} · 盈亏 {formatPercent(entry.totalGainRate)}
          </em>
          {entry.payload?.summary && <p>{entry.payload.summary}</p>}
        </div>
      ))}
    </div>
  )
}

function ModelPerformanceView({ backtests }) {
  if (backtests.status === 'loading') {
    return <div className="soft-empty">正在回测最近的建议</div>
  }
  if (backtests.status === 'error') {
    return <div className="soft-empty">暂时无法读取模型表现</div>
  }
  if (!backtests.summary) {
    return <div className="soft-empty">点开后会统计建议后的 1日、5日、20日表现。</div>
  }

  const summary = backtests.summary
  const items = backtests.items ?? []

  return (
    <div className="model-performance-body">
      <div className="model-performance-grid">
        <div>
          <span>已完成</span>
          <strong>{summary.ready ?? 0}</strong>
        </div>
        <div>
          <span>等待结果</span>
          <strong>{summary.pending ?? 0}</strong>
        </div>
        <div>
          <span>命中率</span>
          <strong>{summary.hitRate === null || summary.hitRate === undefined ? '待统计' : `${summary.hitRate}%`}</strong>
        </div>
      </div>
      {items.length ? (
        <div className="model-performance-list">
          {items.slice(0, 4).map((item) => (
            <div key={item.id}>
              <span>{item.name} · {item.horizonDays}日</span>
              <strong className={item.returnPct >= 0 ? 'is-up' : item.returnPct < 0 ? 'is-down' : ''}>
                {item.status === 'ready' ? formatPercent(item.returnPct) : '等待'}
              </strong>
              <em>{item.payload?.reason ?? (item.hit === null ? '暂不计入命中率' : item.hit ? '方向符合' : '方向偏离')}</em>
            </div>
          ))}
        </div>
      ) : (
        <div className="soft-empty">暂无回测记录，生成持仓建议后会开始统计。</div>
      )}
    </div>
  )
}

function ProfileView({
  userSummary,
  portfolio,
  watchlist,
  apiStatus,
  dataStatus,
  systemStatus,
  isSavingUserProfile,
  saveUserProfile,
  authSession,
  authNotice,
  sendLoginCode,
  loginWithPhone,
  loginWithWechat,
  logoutUser,
  deleteAccount,
  isDeletingAccount,
  openLegalPanel,
}) {
  const summary = userSummary ?? defaultUserSummary
  const profile = summary.profile ?? defaultUserSummary.profile
  const stats = summary.stats ?? defaultUserSummary.stats
  const persona = summary.persona
  const [draftProfile, setDraftProfile] = useState(profile)
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false)

  const portfolioDayGain = portfolio.reduce((sum, item) => sum + (item.dayGain ?? 0), 0)
  const topWatchNames = watchlist
    .map((code) => stocks[code]?.name)
    .filter(Boolean)
    .slice(0, 3)
  const hasChanged = draftProfile.displayName !== profile.displayName
    || draftProfile.riskLevel !== profile.riskLevel
    || draftProfile.defaultMarket !== profile.defaultMarket

  function updateDraftProfile(key, value) {
    setDraftProfile((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <div className="view-stack">
      <section className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          <UserRound size={28} />
        </div>
        <div>
          <p className="caption">{authSession?.authenticated ? '已登录账户' : '本机默认用户'}</p>
          <h2>{profile.displayName}</h2>
          <span>{profile.riskLevel} · {profile.defaultMarket}</span>
        </div>
      </section>

      <section className="profile-stats">
        <div>
          <span>组合市值</span>
          <strong>{currency(stats.portfolioValue ?? 0)}</strong>
        </div>
        <div>
          <span>今日盈亏</span>
          <strong className={portfolioDayGain >= 0 ? 'is-up' : 'is-down'}>
            {currency(portfolioDayGain)}
          </strong>
        </div>
        <div>
          <span>持仓股票</span>
          <strong>{stats.portfolioCount ?? portfolio.length}</strong>
        </div>
        <div>
          <span>观察股票</span>
          <strong>{stats.watchlistCount ?? watchlist.length}</strong>
        </div>
      </section>

      <section className="panel profile-panel">
        <div className="section-title">
          <Settings2 size={18} />
          <h2>账户偏好</h2>
        </div>
        <label className="profile-field">
          <span>昵称</span>
          <input
            value={draftProfile.displayName}
            maxLength={32}
            onChange={(event) => updateDraftProfile('displayName', event.target.value)}
          />
        </label>
        <div className="profile-field">
          <span>风险偏好</span>
          <div className="profile-segments">
            {riskLevels.map((level) => (
              <button
                className={draftProfile.riskLevel === level ? 'is-active' : ''}
                key={level}
                type="button"
                onClick={() => updateDraftProfile('riskLevel', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="profile-field">
          <span>默认市场</span>
          <div className="profile-segments">
            <button className="is-active" type="button">A股</button>
          </div>
        </div>
        <button
          className="secondary-action profile-save"
          type="button"
          disabled={!hasChanged || isSavingUserProfile || !draftProfile.displayName.trim()}
          onClick={() => saveUserProfile({
            ...draftProfile,
            displayName: draftProfile.displayName.trim(),
            defaultMarket: 'A股',
          })}
        >
          {isSavingUserProfile ? '保存中' : '保存资料'}
        </button>
      </section>

      <section className="panel profile-panel">
        <div className="section-title">
          <Bell size={18} />
          <h2>账户状态</h2>
        </div>
        <div className="profile-status-list">
          <div>
            <span>数据连接</span>
            <strong>{apiStatus === 'connected' ? '已连接' : apiStatus === 'offline' ? '离线缓存' : '连接中'}</strong>
          </div>
          <div>
            <span>行情来源</span>
            <strong>{dataStatus?.sourceTrust?.label ?? dataStatus?.source ?? '等待同步'}</strong>
          </div>
          <div>
            <span>未读通知</span>
            <strong>{stats.unreadAlerts ?? 0}</strong>
          </div>
        </div>
      </section>

      {systemStatus && (
        <section className="panel profile-panel">
          <div className="section-title split">
            <div>
              <ShieldAlert size={18} />
              <h2>系统配置检查</h2>
            </div>
            <span>{systemStatus.status === 'ready' ? '已就绪' : systemStatus.status === 'needs_config' ? '待配置' : '需处理'}</span>
          </div>
          <div className="system-check-grid">
            {[
              ['数据库', systemStatus.checks?.database?.ok, systemStatus.checks?.database?.stockCount ? `${systemStatus.checks.database.stockCount} 只股票` : '待检查'],
              ['行情源', systemStatus.checks?.data?.ok, systemStatus.checks?.data?.source ?? '待同步'],
              ['短信', systemStatus.checks?.sms?.ok, systemStatus.checks?.sms?.name ?? '未配置'],
              ['微信', systemStatus.checks?.wechat?.ok, systemStatus.checks?.wechat?.ok ? '已配置' : '未配置'],
              ['任务', systemStatus.checks?.tasks?.ok, systemStatus.checks?.tasks?.errors?.length ? `${systemStatus.checks.tasks.errors.length} 个异常` : '正常'],
              ['错误', systemStatus.checks?.errors?.ok, systemStatus.checks?.errors?.recent?.length ? `${systemStatus.checks.errors.recent.length} 条` : '无'],
            ].map(([label, ok, text]) => (
              <div key={label}>
                <span>{label}</span>
                <strong className={ok ? 'is-ok' : 'is-warn'}>{ok ? 'OK' : '检查'}</strong>
                <em>{text}</em>
              </div>
            ))}
          </div>
          {systemStatus.checks?.tasks?.errors?.length > 0 && (
            <div className="task-error-list">
              {systemStatus.checks.tasks.errors.map((item) => (
                <div key={item.taskId}>
                  <span>{item.taskId}</span>
                  <strong>{item.lastMessage || item.lastError || '等待后台重试'}</strong>
                  <em>连续失败 {item.consecutiveFailures} 次，系统会缩短间隔自动重试。</em>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="panel profile-panel">
        <div className="section-title">
          <Sparkles size={18} />
          <h2>用户画像</h2>
        </div>
        {persona ? (
          <div className="persona-card">
            <div>
              <span>使用风格</span>
              <strong>{persona.style}</strong>
              <p>{persona.styleText}</p>
            </div>
            <div>
              <span>持仓风格</span>
              <strong>{persona.holdingStyle}</strong>
            </div>
            {persona.topIndustries?.length > 0 && (
              <div className="profile-watch-chips">
                {persona.topIndustries.slice(0, 4).map((industry) => (
                  <span key={industry.name}>{industry.name}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="soft-empty">继续搜索、观察和持仓后会形成你的使用画像。</div>
        )}
      </section>

      <section className="panel profile-panel legal-hub">
        <div className="section-title">
          <ShieldAlert size={18} />
          <h2>安全和说明</h2>
        </div>
        <p>
          股镜目前定位为股票研究辅助工具，核心是帮你整理信息、观察风险和记录持仓，不替你做买卖决定。
        </p>
        <div className="legal-actions">
          <button type="button" onClick={() => openLegalPanel('risk')}>
            风险免责声明
          </button>
          <button type="button" onClick={() => openLegalPanel('privacy')}>
            隐私和数据
          </button>
          <a href="/privacy.html" target="_blank" rel="noreferrer">
            隐私政策网页
          </a>
          <button type="button" onClick={() => openLegalPanel('version')}>
            版本进度
          </button>
        </div>
      </section>

      <section className="panel profile-panel">
        <div className="section-title">
          <Sparkles size={18} />
          <h2>常看股票</h2>
        </div>
        {topWatchNames.length ? (
          <div className="profile-watch-chips">
            {topWatchNames.map((name) => <span key={name}>{name}</span>)}
          </div>
        ) : (
          <div className="soft-empty">还没有观察股票。</div>
        )}
      </section>

      <AuthPanel
        authSession={authSession}
        authNotice={authNotice}
        sendLoginCode={sendLoginCode}
        loginWithPhone={loginWithPhone}
        loginWithWechat={loginWithWechat}
        logoutUser={logoutUser}
      />

      <section className="panel profile-panel account-danger-zone">
        <div className="section-title">
          <AlertTriangle size={18} />
          <h2>账户和数据</h2>
        </div>
        <p>清除当前账号保存的持仓、观察池、提醒规则和历史记录。</p>
        <button
          className="danger-action"
          type="button"
          disabled={!authSession?.authenticated}
          onClick={() => setIsDeleteSheetOpen(true)}
        >
          删除账户 / 清除数据
        </button>
        {!authSession?.authenticated && <span>登录后可以管理云端账户数据。</span>}
      </section>

      {isDeleteSheetOpen && (
        <AccountDeleteSheet
          profile={profile}
          portfolioCount={stats.portfolioCount ?? portfolio.length}
          watchlistCount={stats.watchlistCount ?? watchlist.length}
          isDeleting={isDeletingAccount}
          onClose={() => setIsDeleteSheetOpen(false)}
          onConfirm={deleteAccount}
        />
      )}
    </div>
  )
}

function AccountDeleteSheet({
  profile,
  portfolioCount,
  watchlistCount,
  isDeleting,
  onClose,
  onConfirm,
}) {
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText.trim() === '删除'

  async function handleConfirm() {
    if (!canDelete || isDeleting) return
    await onConfirm()
  }

  return (
    <div className="sheet-backdrop legal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="portfolio-sheet account-delete-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <div>
            <span>危险操作</span>
            <h2 id="account-delete-title">删除账户 / 清除数据</h2>
            <p>这一步会清空 {profile.displayName} 的个人数据，并退出到登录页。</p>
          </div>
          <button type="button" onClick={onClose} disabled={isDeleting}>关闭</button>
        </div>

        <div className="delete-impact-list">
          <div>
            <strong>{portfolioCount}</strong>
            <span>持仓记录</span>
          </div>
          <div>
            <strong>{watchlistCount}</strong>
            <span>观察股票</span>
          </div>
          <div>
            <strong>全部</strong>
            <span>提醒和历史</span>
          </div>
        </div>

        <label className="delete-confirm-field">
          <span>输入“删除”确认</span>
          <input
            value={confirmText}
            placeholder="删除"
            onChange={(event) => setConfirmText(event.target.value)}
          />
        </label>

        <div className="delete-sheet-actions">
          <button type="button" onClick={onClose} disabled={isDeleting}>取消</button>
          <button
            className="danger-action"
            type="button"
            disabled={!canDelete || isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting ? '正在删除' : '确认删除'}
          </button>
        </div>
      </section>
    </div>
  )
}

function LegalQuickLinks({ openLegalPanel }) {
  return (
    <div className="legal-quick-links" aria-label="合规说明">
      <button type="button" onClick={() => openLegalPanel('risk')}>风险说明</button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => openLegalPanel('privacy')}>隐私说明</button>
    </div>
  )
}

function LegalSheet({ type, onClose }) {
  const content = legalContent[type] ?? legalContent.risk

  return (
    <div className="sheet-backdrop legal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="portfolio-sheet legal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <div>
            <span>{content.kicker}</span>
            <h2 id="legal-sheet-title">{content.title}</h2>
            <p>{content.summary}</p>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>

        <div className="legal-sheet-body">
          {content.items.map((item) => (
            <div key={item.title} className="legal-note">
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        {type === 'privacy' && (
          <a className="legal-sheet-link" href="/privacy.html" target="_blank" rel="noreferrer">
            打开完整隐私政策网页
          </a>
        )}

        <RiskNotice />
      </section>
    </div>
  )
}

const legalContent = {
  risk: {
    kicker: '使用前说明',
    title: '风险免责声明',
    summary: '股镜只做信息整理和风险观察，不提供证券投资咨询服务。',
    items: [
      {
        title: '不是买卖指令',
        text: '页面中的关注、持仓建议和趋势判断是研究辅助结论，不代表买入、卖出或保证收益。',
      },
      {
        title: '数据可能延迟',
        text: '行情、新闻、财报和模型结果可能因为数据源、网络或缓存出现延迟，关键决策前需要自行核验。',
      },
      {
        title: '模型只做辅助',
        text: '预测模块会参考价格、成交、波动和持仓结构，但不能覆盖突发公告、政策变化和极端市场情绪。',
      },
    ],
  },
  privacy: {
    kicker: '账户和数据',
    title: '隐私和数据说明',
    summary: '第一版会保存必要的账户、观察池和持仓信息，用来生成个人化风险提示。',
    items: [
      {
        title: '会保存什么',
        text: '手机号登录状态、观察股票、持仓金额、提醒规则和风险偏好会保存到后端，用于同步你的个人页面。',
      },
      {
        title: '不会做什么',
        text: '不会要求证券账户密码，不会自动下单，也不会把你的持仓显示给其他用户。',
      },
      {
        title: '后续上线要求',
        text: '隐私政策网页和数据删除入口已接入，正式上架前还需要补充运营主体、联系邮箱、短信和微信登录服务商说明。',
      },
    ],
  },
  version: {
    kicker: 'Beta 进度',
    title: '当前版本状态',
    summary: '股镜还在测试阶段，适合内部试用和功能验证。',
    items: [
      {
        title: '已经完成',
        text: '股票搜索、观察池、持仓、风险引擎、推荐反馈、通知规则和 iOS 模拟器运行已经打通。',
      },
      {
        title: '正在完善',
        text: '真实行情稳定性、历史 K 线、个性化建议记录、短信验证码和微信登录还需要继续接入服务商。',
      },
      {
        title: '上线前检查',
        text: '还需要真机签名、App 图标最终稿、公开域名、免责声明确认和 App Store 截图。',
      },
    ],
  },
}

function AuthPanel({
  authSession,
  authNotice,
  sendLoginCode,
  loginWithPhone,
  loginWithWechat,
  logoutUser,
}) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [localNotice, setLocalNotice] = useState('')

  async function handleSendCode() {
    if (!phone.trim()) return
    setIsSending(true)
    setLocalNotice('')
    try {
      const result = await sendLoginCode(phone.trim())
      if (result.devCode) {
        setCode(result.devCode)
        setLocalNotice(`开发验证码：${result.devCode}`)
      } else {
        setLocalNotice('验证码已发送')
      }
    } catch (error) {
      const message = String(error?.message ?? '')
      if (message.includes('timed out')) {
        setLocalNotice('验证码请求超时，请确认手机和电脑在同一个 Wi-Fi')
      } else {
        setLocalNotice(`验证码发送失败：${message || '请确认后端已启动'}`)
      }
    } finally {
      setIsSending(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (!phone.trim() || !code.trim()) return
    setIsLoggingIn(true)
    setLocalNotice('')
    try {
      await loginWithPhone(phone.trim(), code.trim())
    } catch (error) {
      const message = String(error?.message ?? '')
      if (message.includes('401')) {
        setLocalNotice('验证码不正确或已过期')
      } else if (message.includes('timed out')) {
        setLocalNotice('登录连接超时，请确认手机和电脑在同一个 Wi-Fi')
      } else {
        setLocalNotice('登录失败，请确认后端已启动并允许手机访问')
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (authSession?.authenticated) {
    return (
      <section className="panel auth-panel">
        <div className="auth-signed">
          <div>
            <span>已登录</span>
            <strong>{authSession.profile?.displayName ?? '当前用户'}</strong>
          </div>
          <button type="button" onClick={logoutUser}>
            <LogOut size={16} />
            退出
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="panel auth-panel">
      <div className="section-title">
        <UserRound size={18} />
        <h2>登录账户</h2>
      </div>
      <form className="auth-form" onSubmit={handleLogin}>
        <label>
          <span>手机号码</span>
          <input
            inputMode="tel"
            value={phone}
            placeholder="输入手机号"
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label>
          <span>验证码</span>
          <div className="auth-code-row">
            <input
              inputMode="numeric"
              value={code}
              placeholder="6 位验证码"
              onChange={(event) => setCode(event.target.value)}
            />
            <button type="button" onClick={handleSendCode} disabled={isSending || !phone.trim()}>
              {isSending ? '发送中' : '获取验证码'}
            </button>
          </div>
        </label>
        <button className="secondary-action" type="submit" disabled={isLoggingIn || !phone.trim() || !code.trim()}>
          {isLoggingIn ? '登录中' : '手机号登录'}
        </button>
      </form>
      <button className="wechat-login" type="button" onClick={loginWithWechat}>
        微信登录
      </button>
      {(authNotice || localNotice) && <p className="auth-notice">{localNotice || authNotice}</p>}
    </section>
  )
}

function WatchView({
  watchlist,
  removeFromWatchlist,
  setActiveTab,
  setKlineReturnTab,
  setSelectedCode,
  setQuery,
  notificationSettings,
  alertEvents,
  alertUnreadCount,
  alertMonitorStatus,
  isAlertCenterOpen,
  setIsAlertCenterOpen,
  updateNotificationSettings,
  apiStatus,
  dataStatus,
  taskStatus,
  refreshMarketData,
  isRefreshingData,
  checkAlertEvents,
  isCheckingAlerts,
  markAllAlertsRead,
  markAlertRead,
}) {
  const watchedStocks = watchlist.map((code) => stocks[code]).filter(Boolean)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)

  function toggleNotificationSetting(group, value) {
    const active = notificationSettings[group].includes(value)
    updateNotificationSettings({
      ...notificationSettings,
      [group]: active
        ? notificationSettings[group].filter((item) => item !== value)
        : [...notificationSettings[group], value],
    })
  }

  const automationTasks = taskStatus?.tasks ?? []
  const nextAutomationRun = automationTasks
    .map((task) => task.nextRun)
    .filter(Boolean)
    .sort()[0]
  const automationFocus = [
    {
      label: '观察池',
      value: `${watchedStocks.length} 只`,
      text: '价格、涨跌幅和公告触发提醒',
    },
    {
      label: '通知规则',
      value: notificationSettings.enabled ? '已开启' : '已暂停',
      text: `正在关注 ${notificationSettings.rules.length} 类触发条件`,
    },
    {
      label: '检查频率',
      value: `${taskStatus?.automation?.alertIntervalMinutes ?? 15} 分钟`,
      text: nextAutomationRun ? `下次 ${nextAutomationRun}` : '等待下一轮检查',
    },
  ]

  const automationTaskCopy = {
    portfolio_quotes: {
      title: '持仓变化',
      userText: '帮你看持仓盈亏、仓位风险和建议是否变化。',
    },
    watchlist_quotes: {
      title: '观察池异动',
      userText: '帮你盯观察股票的价格、涨跌幅和趋势信号。',
    },
    alert_check: {
      title: '提醒触发',
      userText: '价格突破、涨跌幅过大、公告财报更新时准备系统通知。',
    },
    stock_directory: {
      title: 'A股目录',
      userText: '每天同步股票代码和企业名称，让中文搜索覆盖更多 A 股。',
    },
    market_universe: {
      title: '市场扫描',
      userText: '刷新全市场强弱，给首页推荐和涨跌榜提供依据。',
    },
  }

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="section-title">
          <Bell size={18} />
          <h2>观察池</h2>
        </div>
        {watchedStocks.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={24} />
            <strong>暂无观察股票</strong>
            <p>在研判页把需要跟踪的股票加入观察池。</p>
          </div>
        ) : (
          <div className="watch-list">
            {watchedStocks.map((stock) => {
              const watchDecision = buildStockDecision(stock)
              return (
              <article className="watch-card" key={stock.code}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCode(stock.code)
                    setQuery(stock.name)
                    setKlineReturnTab('watch')
                    setActiveTab('kline')
                  }}
                >
                  <div>
                    <strong>{stock.name}</strong>
                    <span>
                      {stock.code} · {stock.updated}
                    </span>
                    <StockPriceLine stock={stock} compact />
                  </div>
                  <ChevronRight size={18} />
                </button>
                <div className="watch-market">
                  <Sparkline points={stock.sparkline} positive={stock.performance.day >= 0} />
                  <strong className={`watch-change ${trendClass(stock.performance.day)}`}>
                    {displayStockMove(stock)}
                  </strong>
                  <span>今日涨跌</span>
                </div>
                <div className="watch-reason">
                  <span>观察理由</span>
                  <p>{watchDecision.trendView}</p>
                </div>
                <div className="watch-actions">
                  <span className={`mini-risk tone-${stock.tone}`}>
                    {watchDecision.holdingAdvice}
                  </span>
                  <button
                    className="ghost-icon"
                    type="button"
                    aria-label={`移除 ${stock.name}`}
                    onClick={() => removeFromWatchlist(stock.code)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel alert-feed">
        <button
          className="notification-entry"
          type="button"
          onClick={() => setIsAlertCenterOpen((open) => !open)}
        >
          <span>
            <Bell size={18} />
            <strong>通知中心</strong>
          </span>
          <em>{alertUnreadCount > 0 ? `${alertUnreadCount} 条未读` : '暂无未读'}</em>
          <ChevronRight className={isAlertCenterOpen ? 'is-open' : ''} size={18} />
        </button>
        <div className="alert-monitor-line">
          <span>自动每 {notificationSettings.checkIntervalMinutes ?? 15} 分钟检查</span>
          <em>
            {alertMonitorStatus?.lastCheck
              ? `上次：${alertMonitorStatus.lastCheck}`
              : '等待首次检查'}
          </em>
        </div>
        {isAlertCenterOpen && (
          <div className="notification-center">
            <div className="notification-center__head">
              <div>
                <strong>提醒记录</strong>
                <span>{alertEvents.length ? `最近 ${alertEvents.length} 条` : '暂无提醒'}</span>
              </div>
              <div>
                <button type="button" onClick={checkAlertEvents} disabled={isCheckingAlerts || !notificationSettings.enabled}>
                  {isCheckingAlerts ? '检查中' : '立即检查'}
                </button>
                <button type="button" onClick={markAllAlertsRead} disabled={!alertUnreadCount}>
                  <CheckCheck size={15} />
                  全部已读
                </button>
              </div>
            </div>
            {!notificationSettings.enabled ? (
              <div className="soft-empty">观察池通知已关闭，系统暂不检查提醒。</div>
            ) : alertEvents.length === 0 ? (
              <div className="soft-empty">暂无触发提醒，观察池股票还在正常跟踪中。</div>
            ) : (
              <div className="alert-event-list">
                {alertEvents.map((event) => (
                  <article className={`alert-event alert-event--${event.severity}`} key={event.id}>
                    <div>
                      <strong>{event.title}</strong>
                      <span>
                        {event.code} · {event.createdAt}
                      </span>
                    </div>
                    <p>{event.text}</p>
                    <footer>
                      <i className={event.read ? 'is-read' : 'is-unread'}>{event.read ? '已读' : '未读'}</i>
                      <b>{event.type === 'news' ? '消息' : event.type === 'breakout' ? '突破' : event.type === 'advice-change' ? '建议' : '波动'}</b>
                      <button
                        type="button"
                        onClick={() => {
                          const stock = stocks[event.code]
                          if (stock) {
                            setSelectedCode(event.code)
                            setQuery(stock.name)
                            setActiveTab('discover')
                          }
                          if (!event.read) void markAlertRead(event.id)
                        }}
                      >
                        查看股票
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel notification-panel">
        <button
          className="notification-entry"
          type="button"
          onClick={() => setIsNotificationSettingsOpen((open) => !open)}
        >
          <span>
            <Settings2 size={18} />
            <strong>通知设置</strong>
          </span>
          <em>{notificationSettings.enabled ? '已开启' : '已关闭'}</em>
          <ChevronRight className={isNotificationSettingsOpen ? 'is-open' : ''} size={18} />
        </button>
        {isNotificationSettingsOpen && (
          <div className="notification-settings-body">
            <label className="notify-master">
              <span>
                <strong>观察池通知</strong>
                <em>触发条件时发送手机系统通知</em>
              </span>
              <input
                checked={notificationSettings.enabled}
                type="checkbox"
                onChange={(event) =>
                  updateNotificationSettings({
                    ...notificationSettings,
                    enabled: event.target.checked,
                  })
                }
              />
            </label>
            <div className="notify-group">
              <span>通知方式</span>
              <div className="notify-options">
                {notificationChannels.map((channel) => (
                  <label key={channel}>
                    <input
                      checked={notificationSettings.channels.includes(channel)}
                      disabled={!notificationSettings.enabled}
                      type="checkbox"
                      onChange={() => toggleNotificationSetting('channels', channel)}
                    />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="notify-group">
              <span>提醒规则</span>
              <div className="alert-rules">
              {alertTemplates.map((alert) => (
                <label key={alert}>
                  <input
                    checked={notificationSettings.rules.includes(alert)}
                    disabled={!notificationSettings.enabled}
                    type="checkbox"
                    onChange={() => toggleNotificationSetting('rules', alert)}
                  />
                  <span>{alert}</span>
                </label>
              ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="data-status">
        <div>
          <span>数据状态</span>
          <strong>
            {apiStatus === 'connected'
              ? dataStatus?.mode === 'live'
                ? '真实行情已刷新'
                : dataStatus?.mode === 'fallback'
                  ? '行情源暂不可用'
                  : '后端已连接'
              : '本地演示数据'}
          </strong>
        </div>
        <p>{dataStatus?.message ?? '接入授权行情后，可切换为实时、延迟 15 分钟或盘后更新。'}</p>
        {dataStatus?.stockDirectory && (
          <p>
            股票目录：{dataStatus.stockDirectory.count ?? 0} 只
            {dataStatus.stockDirectory.mode === 'live' ? '，已接入全量名称库' : '，等待后台同步'}
          </p>
        )}
        {dataStatus?.lastRefresh && <em>最近刷新：{dataStatus.lastRefresh}</em>}
        <button type="button" onClick={refreshMarketData} disabled={isRefreshingData}>
          {isRefreshingData ? '刷新中...' : '刷新行情'}
        </button>
      </section>

      <details className="panel automation-panel">
        <summary>
          <span>
            <Settings2 size={18} />
            <strong>自动盯盘助手</strong>
          </span>
          <em>{taskStatus?.automation?.enabled ? '运行中' : '已暂停'}</em>
          <ChevronRight size={18} />
        </summary>
        <div className="automation-hero">
          <strong>你选股票，系统负责盯变化</strong>
          <p>观察池、持仓和提醒规则会按固定频率检查。你可以随时手动检查一次，也可以只等系统通知。</p>
        </div>
        <div className="automation-focus">
          {automationFocus.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <div className="automation-actions">
          <button type="button" onClick={checkAlertEvents} disabled={isCheckingAlerts}>
            <CheckCheck size={16} />
            {isCheckingAlerts ? '检查中...' : '立即检查提醒'}
          </button>
          <button type="button" onClick={refreshMarketData} disabled={isRefreshingData}>
            <TrendingUp size={16} />
            {isRefreshingData ? '刷新中...' : '刷新行情数据'}
          </button>
        </div>
        <div className="automation-list">
          {automationTasks.map((task) => {
            const copy = automationTaskCopy[task.taskId] ?? {
              title: task.label,
              userText: '系统会按规则自动检查这个项目。',
            }
            return (
            <div key={task.taskId}>
              <strong>{copy.title}</strong>
              <p>{copy.userText}</p>
              <span>{task.lastRun ? `上次 ${task.lastRun}` : '等待首次运行'}</span>
              <em>
                {task.health?.consecutiveFailures
                  ? `异常 ${task.health.consecutiveFailures} 次 · ${task.health.lastError ?? '待重试'}`
                  : task.nextRun
                    ? `下次 ${task.nextRun}`
                    : `${task.intervalMinutes} 分钟间隔`}
              </em>
            </div>
            )
          })}
        </div>
      </details>

      <section className="author-note">
        <span>Alex-w有话说</span>
        <p>
          前端主结构已经跑通，后端也开始接入真实持仓逻辑：搜索、观察、持仓和行情缓存会逐步变成可长期使用的数据底座。
        </p>
        <div>
          <strong>最近进度</strong>
          <ul>
            <li>已新增全量 A 股股票目录库，支持企业名称、关键词和代码搜索</li>
            <li>已支持买入、减仓、修改成本和持仓流水</li>
            <li>后台会自动同步目录、行情、观察提醒和新闻缓存</li>
            <li>下一步会继续完善上架材料、稳定性监控和真实通知服务</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

function RiskNotice() {
  return (
    <aside className="risk-notice">
      <AlertTriangle size={17} />
      <p>
        本工具仅做信息整理和风险观察，不构成证券投资建议。样例内容为演示数据。
      </p>
    </aside>
  )
}

export default App
