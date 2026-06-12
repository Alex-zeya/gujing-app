import { useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CheckCheck,
  Fingerprint,
  LogOut,
  MessageCircle,
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

const GujingAppleSignIn = registerPlugin('GujingAppleSignIn')
const GujingWechatLogin = registerPlugin('GujingWechatLogin')

function isNativeIosApp() {
  return Capacitor.getPlatform?.() === 'ios' && Capacitor.isNativePlatform?.()
}

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

function mergeStockRecord(existing, incoming) {
  if (!existing) return incoming
  if (!incoming) return existing
  return {
    ...existing,
    ...incoming,
    analysisScore: incoming.analysisScore ?? existing.analysisScore,
    dataQuality: incoming.dataQuality ?? existing.dataQuality,
    klineRows: incoming.klineRows ?? existing.klineRows,
    newsImpact: incoming.newsImpact ?? existing.newsImpact,
    sourceTrust: incoming.sourceTrust ?? existing.sourceTrust,
  }
}

function mergeStockCatalog(current, incomingList) {
  const next = { ...current }
  incomingList.forEach((stock) => {
    if (!stock?.code) return
    const clean = cleanCode(stock.code)
    next[clean] = mergeStockRecord(next[clean], { ...stock, code: clean })
  })
  return next
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
    pulse: stock.pulse ?? '已匹配企业名称，点开后会优先同步行情，再补走势样本。',
    updated: stock.updated ?? '行情同步中',
    score: stock.score ?? 58,
    tags: stock.tags ?? [stock.industry, '名称匹配'],
    idea: stock.idea ?? {
      stance: '先观察',
      horizon: '短中期',
      reason: '已从股票名称目录匹配，先确认实时价格和走势样本。',
      risk: '当前只有目录信息，先不要只凭名称判断持仓。',
      trigger: '行情同步完成后再查看趋势、价格和系统建议。',
    },
    metrics: stock.metrics ?? [['状态', '行情同步中', '行情'], ['分类', stock.industry, '目录'], ['数据源', '名称目录', '搜索']],
    signals: stock.signals ?? [
      { title: '搜索', level: '已匹配', text: '企业名称与关键词匹配。' },
      { title: '行情', level: '同步中', text: '点开分析后会尝试同步实时价格。' },
      { title: '风险', level: '需观察', text: '需要结合K线、成交额和行业变化再判断。' },
    ],
    checklist: stock.checklist ?? ['同步实时价格', '积累历史K线', '查看行业和公告变化'],
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
  return raw === 'A股' ? '未分类持仓' : '其他'
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

function formatDuration(seconds) {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return '刚启动'
  const minutes = Math.floor(value / 60)
  if (minutes < 1) return `${Math.floor(value)} 秒`
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时 ${minutes % 60} 分钟`
  const days = Math.floor(hours / 24)
  return `${days} 天 ${hours % 24} 小时`
}

function stockPriceNumber(stock) {
  const value = Number(String(stock?.price ?? '').replace(/,/g, ''))
  return Number.isFinite(value) ? value : 0
}

function hasLivePrice(stock) {
  return stockPriceNumber(stock) > 0
}

function displayStockPrice(stock) {
  return hasLivePrice(stock) ? stock.price : '行情同步中'
}

function displayStockMove(stock) {
  const dayMove = Number(stock?.performance?.day ?? 0)
  return hasLivePrice(stock) ? formatPercent(dayMove) : '同步中'
}

function stockDayMove(stock) {
  const value = Number(stock?.performance?.day ?? 0)
  return Number.isFinite(value) ? value : 0
}

function stockMonthMove(stock) {
  const value = Number(stock?.performance?.month ?? 0)
  return Number.isFinite(value) ? value : 0
}

function StockPriceLine({ stock, compact = false }) {
  return (
    <span className={compact ? 'stock-price-line is-compact' : 'stock-price-line'}>
      <b>{hasLivePrice(stock) ? `¥${stock.price}` : '行情同步中'}</b>
      {hasLivePrice(stock) && <em>/股</em>}
    </span>
  )
}

function missingLabel(kind = 'field') {
  if (kind === 'quote') return '行情同步中'
  if (kind === 'history') return '样本积累中'
  if (kind === 'fundamental') return '暂未披露'
  if (kind === 'trend') return '观察中'
  return '暂未披露'
}

function normalizeDataCopy(value) {
  return String(value ?? '')
    .replaceAll('待补充', '持续跟踪')
    .replaceAll('待分析', '持续观察')
    .replaceAll('等待行情', '行情同步中')
    .replaceAll('行情更新中', '行情同步中')
    .replaceAll('待同步', '同步中')
    .replaceAll('数据源暂缺', '暂未披露')
    .replaceAll('暂无公开数据', '暂未披露')
    .replaceAll('暂无数据', '暂未披露')
    .replaceAll('暂缺完整基本面和历史指标', '基本面和历史样本仍在完善')
    .replaceAll('补充分析', '继续分析')
    .replaceAll('补充数据', '继续同步数据')
    .replaceAll('暂未计算完整技术指标和基本面评分。', '技术指标和基本面评分样本仍在完善。')
    .replaceAll('补齐', '完善')
}

function normalizedTags(tags = []) {
  return [...new Set(tags.map((tag) => normalizeDataCopy(tag)).filter(Boolean))]
}

function hasStatValue(value) {
  return !(value === null || value === undefined || value === '')
}

function formatStatValue(value, suffix = '', kind = 'field') {
  if (!hasStatValue(value)) return missingLabel(kind)
  if (typeof value === 'number') return `${value.toFixed(2)}${suffix}`
  return `${value}${suffix}`
}

function formatLevelValue(value, suffix = '', kind = 'field') {
  if (!hasStatValue(value)) return missingLabel(kind)
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
    ['今日开盘价', stats.open ?? lastCandle?.open, 'quote'],
    ['昨日收市价', previousClose, 'quote'],
    ['今日最高价', stats.dayHigh ?? lastCandle?.high, 'quote'],
    ['今日最低价', stats.dayLow ?? lastCandle?.low, 'quote'],
    ['历史最高价', historyHigh, 'history'],
    ['成交量', stats.volume, 'quote'],
    ['成交额', stats.amount, 'quote'],
    ['企业市值', stats.marketCap, 'fundamental'],
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
      trendView: '当前已有实时价格，历史 K 线样本还在积累中，先看价格是否连续稳定，再判断仓位。',
      systemAnalysis: `已读取实时价格和今日涨跌，但历史走势样本还不完整。${industryHint}、财报和成交量需要继续跟踪后再判断。`,
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
      holdingAdvice: score >= 70 ? '持仓观察条件较好' : '趋势较强，但追高风险较高',
      trendView: `近一月上涨 ${monthMove.toFixed(2)}%，价格仍有惯性。短期重点看回撤时能不能守住近 10 日均价区域。`,
      systemAnalysis: `${stock.name}短期走势占优，但上涨后风险也会变高。适合把观察重点放在成交额持续性、公告变化和${industryHint}热度是否延续。`,
    }
  }

  if (isRecovering) {
    return {
      hasHistory,
      holdingAdvice: '可以轻仓观察，新增资金先等确认',
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
  const dayMove = stockDayMove(stock)
  const monthMove = stockMonthMove(stock)
  return {
    total,
    stance: decision.holdingAdvice,
    reasons: [decision.trendView],
    factors: [
      { name: '短期动量', score: Math.max(0, Math.min(100, 50 + dayMove * 3)), text: `今日 ${displayStockMove(stock)}` },
      { name: '趋势质量', score: Math.max(0, Math.min(100, 50 + monthMove * 2)), text: `近一月 ${formatPercent(monthMove)}` },
      { name: '数据完整度', score: stock.dataCoverage?.history ? 80 : 45, text: stock.dataCoverage?.history ? '已接入历史K线' : '历史数据会随每日缓存逐步积累' },
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

  if (concentration.industry === '未分类持仓') {
    advice.push(`未分类持仓占比 ${topRatio}%，说明部分股票还缺少明确行业标签。先完善行业和基础数据，再判断是否真的集中。`)
  } else if (topRatio >= 60) {
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

function buildCapitalTips(capital, portfolio) {
  const tips = []
  const holdingCost = Number(capital.holdingCost ?? 0)
  const marketValue = Number(capital.marketValue ?? 0)
  const unrealizedGain = Number(capital.unrealizedGain ?? 0)
  const realizedGain = Number(capital.realizedGain ?? 0)
  const totalBuyAmount = Number(capital.totalBuyAmount ?? 0)
  const totalSellAmount = Number(capital.totalSellAmount ?? 0)
  const accountValue = Number(capital.accountValue ?? 0)
  const availableCash = Number(capital.availableCash ?? totalSellAmount)
  const topLoss = [...portfolio].sort((a, b) => (a.totalGainRate ?? 0) - (b.totalGainRate ?? 0))[0]

  if (!portfolio.length) {
    return ['先添加一只持仓，系统会自动拆分本金、浮盈和已卖出收益。']
  }
  if (accountValue > 0) {
    tips.push(`账户估算资产 ${currency(accountValue)}，由当前市值和卖出回收现金组成。`)
  }
  if (holdingCost > 0) {
    tips.push(`当前还有 ${currency(holdingCost)} 本金在持仓里，对应市值 ${currency(marketValue)}。`)
  }
  if (totalSellAmount > 0) {
    tips.push(`已经卖出回收 ${currency(availableCash)}，其中已实现收益 ${currency(realizedGain)}。`)
  }
  if (unrealizedGain < 0 && topLoss) {
    tips.push(`${topLoss.name} 是当前拖累较明显的持仓，先复盘买入理由和仓位。`)
  } else if (unrealizedGain > 0) {
    tips.push(`当前浮动盈利 ${currency(unrealizedGain)}，可以开始设置止盈或减仓观察线。`)
  }
  if (totalBuyAmount > 0 && totalSellAmount === 0) {
    tips.push('目前只有买入记录，还没有卖出记录，已实现收益会在减仓后开始计算。')
  }
  return tips.slice(0, 3)
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
  const [volatilityRadar, setVolatilityRadar] = useState(null)
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
  const [systemMonitor, setSystemMonitor] = useState(null)
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
  const totalAmount = portfolio.reduce((sum, item) => sum + (item.marketValue ?? item.amount), 0)

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

        const [stockList, overview, recommendations, radar, watchItems, portfolioSnapshot, insights, alertSettings, alertFeed, providerStatus, taskData, userData, readiness, monitor] = await Promise.all([
          apiJson('/api/stocks'),
          apiJson('/api/market/overview'),
          apiJson('/api/recommendations/today'),
          apiJson('/api/market/volatility-radar'),
          apiJson('/api/watchlist'),
          apiJson('/api/portfolio'),
          apiJson('/api/portfolio/insights'),
          apiJson('/api/alerts/settings'),
          apiJson('/api/alerts/events'),
          apiJson('/api/data/status'),
          apiJson('/api/tasks/status'),
          apiJson('/api/user/summary'),
          apiJson('/api/system/readiness'),
          apiJson('/api/system/monitor'),
        ])

        if (!isMounted) return
        setStockCatalog((current) => mergeStockCatalog(
          {
            ...searchSeedStocks,
            ...current,
          },
          [...stockList, ...recommendations, ...(radar?.items ?? [])],
        ))
        setRecommendedStocks(recommendations)
        setVolatilityRadar(radar)
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
        setSystemMonitor(monitor)
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
        const [overview, recommendations, radar, alertFeed, providerStatus, taskData, readiness, monitor] = await Promise.all([
          apiJson('/api/market/overview'),
          apiJson('/api/recommendations/today'),
          apiJson('/api/market/volatility-radar'),
          apiJson('/api/alerts/events'),
          apiJson('/api/data/status'),
          apiJson('/api/tasks/status'),
          apiJson('/api/system/readiness'),
          apiJson('/api/system/monitor'),
        ])
        setMarketOverview(overview)
        setRecommendedStocks(recommendations)
        setVolatilityRadar(radar)
        setStockCatalog((current) => mergeStockCatalog(current, [...recommendations, ...(radar?.items ?? [])]))
        setAlertEvents(alertFeed.events ?? [])
        setAlertUnreadCount(alertFeed.unreadCount ?? 0)
        setAlertMonitorStatus(alertFeed.status ?? null)
        setDataStatus(providerStatus)
        setTaskStatus(taskData)
        setSystemStatus(readiness)
        setSystemMonitor(monitor)
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
          `/api/stocks/search?keyword=${encodeURIComponent(keyword)}&with_quotes=false`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        setStockCatalog((current) => mergeStockCatalog(current, backendMatches))
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
      const results = await apiJson(`/api/stocks/search?keyword=${encodeURIComponent(query.trim())}&with_quotes=false`)
      const cnResults = results.filter((item) => item.market === 'cn')
      const mergedResults = mergeStockLists(localMatches, cnResults, 8)
      if (mergedResults.length > 1) {
        setStockCatalog((current) => mergeStockCatalog(current, mergedResults))
        setSearchSuggestions(mergedResults)
        setIsSearchFocused(true)
        setSearchNotice(`找到 ${mergedResults.length} 只相关股票，点企业名称进入分析。`)
        setApiStatus('connected')
        return
      }
      if (mergedResults.length === 1) {
        const matchedStock = mergedResults[0]
        setStockCatalog((current) => mergeStockCatalog(current, [matchedStock]))
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
      const [klineResult, analysisResult] = await Promise.allSettled([
        apiJson(`/api/stocks/${code}/kline`),
        apiJson(`/api/stocks/${code}/analysis`),
      ])
      const klineData = klineResult.status === 'fulfilled' ? klineResult.value : null
      const analysisData = analysisResult.status === 'fulfilled' ? analysisResult.value : null
      const baseStock = klineData?.stock ?? stockCatalogRef.current[code]
      const updatedStock = baseStock
        ? {
            ...baseStock,
            ...(analysisData?.analysisScore ? { analysisScore: analysisData.analysisScore } : {}),
            ...(analysisData?.newsImpact ? { newsImpact: analysisData.newsImpact } : {}),
            klineRows: klineData?.candles ?? baseStock.klineRows,
          }
        : null
      if (updatedStock) {
        setStockCatalog((current) => ({
          ...current,
          [cleanCode(updatedStock.code)]: updatedStock,
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
    void recordRecommendationFeedback(clean, 'analyze', 'search')
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
          dayGain: amount * (stockDayMove(stock) / 100),
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

  async function sellStockFromPortfolio(code, payload) {
    const clean = cleanCode(code)
    if (!clean) return
    try {
      const snapshot = await apiJson(`/api/portfolio/${clean}/sell`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setPortfolio(portfolioSnapshotToItems(snapshot))
      const insights = await apiJson('/api/portfolio/insights')
      setPortfolioInsights(insights)
      void refreshUserSummary()
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
      throw new Error('sell failed')
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

  async function finishLogin(result, notice = '登录成功') {
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    setAuthSession(result)
    setAuthNotice(notice)
    const [watchItems, portfolioSnapshot, insights, alertSettings, alertFeed, taskData, userData, readiness, monitor] = await Promise.all([
      apiJson('/api/watchlist'),
      apiJson('/api/portfolio'),
      apiJson('/api/portfolio/insights'),
      apiJson('/api/alerts/settings'),
      apiJson('/api/alerts/events'),
      apiJson('/api/tasks/status'),
      apiJson('/api/user/summary'),
      apiJson('/api/system/readiness'),
      apiJson('/api/system/monitor'),
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
    setSystemMonitor(monitor)
    setApiStatus('connected')
    return result
  }

  async function loginWithApple() {
    try {
      if (!isNativeIosApp()) {
        setAuthNotice('Apple 登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
        throw new Error('Apple native login unavailable in web preview')
      }

      const appleCredential = await GujingAppleSignIn.signIn()
      if (!appleCredential?.identityToken) {
        throw new Error('Apple 登录未返回 identity token')
      }

      const result = await apiJson('/api/auth/apple/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(appleCredential),
      })
      return finishLogin(result, 'Apple 登录成功')
    } catch (error) {
      const message = String(error?.message ?? '')
      if (message.includes('web preview')) {
        setAuthNotice('Apple 登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
      } else if (message.includes('已取消')) {
        setAuthNotice('已取消 Apple 登录。')
      } else {
        setAuthNotice(message.includes('501')
          ? 'Apple 登录需要先在 Apple Developer 和 Xcode 开启 Sign in with Apple。'
          : 'Apple 登录暂时不可用，请稍后再试。')
      }
      throw error
    }
  }

  async function loginWithWechat() {
    try {
      const status = await apiJson('/api/auth/wechat/status', { skipAuth: true })
      if (!status.configured) {
        setAuthNotice('微信登录需要先完成微信开放平台移动应用配置，并在 Render 填入 AppID 和 Secret。')
        throw new Error('wechat server not configured')
      }

      if (!isNativeIosApp()) {
        setAuthNotice('微信登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
        throw new Error('wechat native login unavailable in web preview')
      }

      const nativeStatus = await GujingWechatLogin.status()
      if (!nativeStatus?.installed) {
        setAuthNotice('当前设备未检测到微信，请安装微信后再试。')
        throw new Error('wechat not installed')
      }

      const wechatCredential = await GujingWechatLogin.login()
      if (!wechatCredential?.code) {
        throw new Error('微信登录未返回授权 code')
      }

      const result = await apiJson('/api/auth/wechat/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(wechatCredential),
      })
      return finishLogin(result, '微信登录成功')
    } catch (error) {
      const message = String(error?.message ?? '')
      if (message.includes('web preview')) {
        setAuthNotice('微信登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
      } else if (message.includes('not installed')) {
        setAuthNotice('当前设备未检测到微信，请安装微信后再试。')
      } else if (message.includes('not configured') || message.includes('501')) {
        setAuthNotice('微信登录需要先完成微信开放平台移动应用配置，并在 Render 填入 AppID 和 Secret。')
      } else if (message.includes('OpenSDK')) {
        setAuthNotice('微信登录原生 SDK 还未加入 Xcode，等 AppID 审核通过后接入。')
      } else {
        setAuthNotice('微信登录暂时不可用，请稍后再试。')
      }
      throw error
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
      const [stockList, overview, recommendations, radar, portfolioSnapshot, insights, alertFeed, providerStatus, taskData, userData, readiness, monitor] = await Promise.all([
        apiJson('/api/stocks'),
        apiJson('/api/market/overview'),
        apiJson('/api/recommendations/today'),
        apiJson('/api/market/volatility-radar?refresh_news=true'),
        apiJson('/api/portfolio'),
        apiJson('/api/portfolio/insights'),
        apiJson('/api/alerts/events'),
        apiJson('/api/data/status'),
        apiJson('/api/tasks/status'),
        apiJson('/api/user/summary'),
        apiJson('/api/system/readiness'),
        apiJson('/api/system/monitor'),
      ])
      setStockCatalog((current) => mergeStockCatalog(
        {
          ...searchSeedStocks,
          ...current,
        },
        [...stockList, ...recommendations, ...(radar?.items ?? [])],
      ))
      setRecommendedStocks(recommendations)
      setVolatilityRadar(radar)
      setMarketOverview(overview)
      setPortfolio(portfolioSnapshotToItems(portfolioSnapshot))
      setPortfolioInsights(insights)
      setAlertEvents(alertFeed.events ?? [])
      setAlertUnreadCount(alertFeed.unreadCount ?? 0)
      setAlertMonitorStatus(alertFeed.status ?? null)
      setTaskStatus(taskData)
      setUserSummary(userData)
      setSystemStatus(readiness)
      setSystemMonitor(monitor)
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

  async function runDailyBackfill() {
    setIsRefreshingData(true)
    try {
      await apiJson('/api/data/backfill/daily', {
        method: 'POST',
        timeoutMs: 60000,
        body: JSON.stringify({ limit: 20, force: false }),
      })
      const [stockList, recommendations, providerStatus, taskData, monitor] = await Promise.all([
        apiJson('/api/stocks'),
        apiJson('/api/recommendations/today'),
        apiJson('/api/data/status'),
        apiJson('/api/tasks/status'),
        apiJson('/api/system/monitor'),
      ])
      setStockCatalog((current) => mergeStockCatalog(
        {
          ...searchSeedStocks,
          ...current,
        },
        [...stockList, ...recommendations],
      ))
      setRecommendedStocks(recommendations)
      setDataStatus(providerStatus)
      setTaskStatus(taskData)
      setSystemMonitor(monitor)
      setApiStatus('connected')
    } catch {
      setApiStatus('offline')
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
          loginWithApple={loginWithApple}
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
            volatilityRadar={volatilityRadar}
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
            buyHolding={addStockToPortfolio}
            sellHolding={sellStockFromPortfolio}
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
            runDailyBackfill={runDailyBackfill}
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
            systemMonitor={systemMonitor}
            isSavingUserProfile={isSavingUserProfile}
            saveUserProfile={saveUserProfile}
            authSession={authSession}
            authNotice={authNotice}
            loginWithApple={loginWithApple}
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
  loginWithApple,
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
          loginWithApple={loginWithApple}
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
  volatilityRadar,
  dismissedRecommendationCodes,
  marketOverview,
  watchlist,
  addStockToWatchlist,
  dismissRecommendation,
  analyzeRecommendation,
}) {
  const activeRecommendations = recommendedStocks.filter((stock) => !dismissedRecommendationCodes.includes(stock.code))
  const recommendedStock = activeRecommendations[0]
    ?? [...marketStocks].sort((a, b) => stockMonthMove(b) - stockMonthMove(a))[0]
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
            <strong className={trendClass(stockDayMove(recommendedStock))}>
              {formatPercent(stockDayMove(recommendedStock))}
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
            <p>{normalizeDataCopy(recommendationDecision.trendView)}</p>
          </div>
          <div>
            <span>主要风险</span>
            <p>{normalizeDataCopy(recommendationDecision.systemAnalysis)}</p>
          </div>
          <div>
            <span>观察点</span>
            <p>当前建议：{recommendationDecision.holdingAdvice}。后续重点看今日涨跌是否延续，以及近一月趋势是否继续改善。</p>
          </div>
        </div>

        <div className="tag-row">
          {normalizedTags(recommendedStock.tags).map((tag) => (
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

      <VolatilityRadarCard
        radar={volatilityRadar}
        stocksByCode={{ ...stocks, ...Object.fromEntries(marketStocks.map((stock) => [stock.code, stock])) }}
        onAnalyze={analyzeRecommendation}
      />

      <RiskNotice />
    </div>
  )
}

function VolatilityRadarCard({ radar, stocksByCode, onAnalyze }) {
  const items = radar?.items ?? []
  if (!items.length) return null
  return (
    <section className="panel volatility-radar-card">
      <div className="section-title split">
        <div>
          <AlertTriangle size={18} />
          <h2>波动雷达</h2>
        </div>
        <span>{radar.refreshIntervalMinutes ?? 15} 分钟更新</span>
      </div>
      <p className="volatility-radar-summary">{radar.summary}</p>
      <div className="volatility-radar-list">
        {items.slice(0, 5).map((item) => {
          const stock = stocksByCode[item.code] ?? {
            ...item,
            market: 'cn',
            performance: {
              day: item.signals?.dayMove ?? 0,
              week: item.signals?.weekMove ?? 0,
              month: item.signals?.monthMove ?? 0,
            },
            tags: [item.industry],
            score: item.score,
            tone: item.direction === 'down' ? 'warning' : 'neutral',
            pulse: item.reasons?.[0] ?? '波动雷达提示需要继续观察。',
            chart: [1, 1],
            sparkline: [1, 1],
          }
          return (
            <button key={item.code} type="button" onClick={() => onAnalyze(stock)}>
              <div className="volatility-radar-rank">
                <strong>{item.score}</strong>
                <span>{item.level}</span>
              </div>
              <div>
                <b>{item.name}</b>
                <em>{item.code} · {item.industry}</em>
                <p>{item.reasons?.[0] ?? '行情和新闻缓存提示需要观察。'}</p>
              </div>
              <i className={item.direction === 'down' ? 'is-down' : item.direction === 'up' ? 'is-up' : ''}>
                {formatPercent(item.signals?.dayMove ?? 0)}
              </i>
            </button>
          )
        })}
      </div>
      <small>{radar.dataNote}</small>
    </section>
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
  const monthMove = stockMonthMove(stock)
  const decision = buildStockDecision(stock)
  const analysisScore = stock.analysisScore ?? fallbackAnalysisScore(stock)
  const forecast = analysisScore.forecast
  const dataQuality = analysisScore.dataQuality
  const industryModel = analysisScore.industryModel ?? analysisScore.advice?.industryModel
  const researchFramework = analysisScore.researchFramework ?? analysisScore.advice?.researchFramework
  const competitiveIntel = analysisScore.competitiveIntel ?? researchFramework?.competitiveIntel
  const fundamentalProfile = analysisScore.fundamentalProfile ?? researchFramework?.fundamentalProfile
  const compliance = analysisScore.compliance
  const newsImpact = stock.newsImpact
  const summaryPoints = [
    { label: '结论', value: decision.holdingAdvice },
    { label: '趋势', value: decision.hasHistory ? formatPercent(monthMove) : missingLabel('history'), tone: decision.hasHistory ? trendClass(monthMove) : 'is-pending' },
    { label: '数据', value: dataQuality?.label ?? '检查中' },
  ]

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
            <strong className="is-pending">{missingLabel('history')}</strong>
          )}
        </div>
      </div>

      <div className="analysis-score-card">
        <div>
          <span>综合判断</span>
          <strong>{analysisScore.total}</strong>
        </div>
          <p>{normalizeDataCopy(`${analysisScore.stance}：${analysisScore.reasons.slice(0, 2).join('，')}`)}</p>
      </div>

      <div className="decision-copy">
        <span>未来走势</span>
          <p>{normalizeDataCopy(decision.trendView)}</p>
      </div>

      <div className="analysis-quick-summary" aria-label="分析快速结论">
        {summaryPoints.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong className={item.tone ?? ''}>{item.value}</strong>
          </div>
        ))}
      </div>

      <details className="analysis-disclosure analysis-more">
        <summary>
          <span>展开进阶分析</span>
          <strong>模型、数据、行业</strong>
          <ChevronRight size={17} />
        </summary>
        <div className="analysis-more-stack">
      {researchFramework && (
        <details className="analysis-disclosure research-framework">
          <summary>
            <span>研究框架</span>
            <strong>{researchFramework.conclusion}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="research-framework-card">
            <div className="research-framework-head">
              <div>
                <span>{researchFramework.title}</span>
                <strong>{researchFramework.total}</strong>
              </div>
              <p>{researchFramework.summary}</p>
            </div>
            <div className="research-framework-grid">
              {researchFramework.groups?.slice(0, 5).map((group) => (
                <article key={group.id}>
                  <div>
                    <span>{group.title}</span>
                    <strong>{group.score}</strong>
                  </div>
                  <b>{group.summary}</b>
                  {group.evidence?.slice(0, 2).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </article>
              ))}
            </div>
            <div className="research-framework-lists">
              <div>
                <span>支持理由</span>
                {researchFramework.bullCase?.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
              </div>
              <div>
                <span>还要确认</span>
                {researchFramework.nextQuestions?.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
            <small>{researchFramework.compliance}</small>
          </div>
        </details>
      )}

      {competitiveIntel && (
        <details className="analysis-disclosure competitive-intel">
          <summary>
            <span>行业竞争力</span>
            <strong>{competitiveIntel.verdict}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="competitive-intel-card">
            <div className="competitive-intel-head">
              <div>
                <span>{competitiveIntel.title}</span>
                <strong>{competitiveIntel.total}</strong>
              </div>
              <p>{competitiveIntel.summary}</p>
            </div>
            <div className="competitive-peer-strip" aria-label="主要对比公司">
              {competitiveIntel.peerSet?.slice(0, 5).map((peer) => (
                <span key={peer}>{peer}</span>
              ))}
            </div>
            <div className="competitive-signal-list">
              {competitiveIntel.signals?.slice(0, 3).map((signal) => (
                <article key={signal.name}>
                  <div>
                    <span>{signal.name}</span>
                  <strong>{normalizeDataCopy(signal.value)}</strong>
                </div>
                  <p>{normalizeDataCopy(signal.text)}</p>
                </article>
              ))}
            </div>
            <div className="competitive-impact">
              <span>对持仓的影响</span>
              <p>{normalizeDataCopy(competitiveIntel.holdingImpact)}</p>
            </div>
            <div className="competitive-intel-lists">
              <div>
                <span>继续看什么</span>
                {competitiveIntel.watchSignals?.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
              </div>
              <div>
                <span>主要风险</span>
                {competitiveIntel.risks?.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
            <small>{competitiveIntel.dataNote}</small>
          </div>
        </details>
      )}

      {fundamentalProfile && (
        <details className="analysis-disclosure fundamental-profile">
          <summary>
            <span>基本面</span>
            <strong>{fundamentalProfile.label}</strong>
            <ChevronRight size={17} />
          </summary>
          <div className="fundamental-profile-card">
            <div className="fundamental-profile-head">
              <div>
                <span>{fundamentalProfile.title}</span>
                <strong>{fundamentalProfile.score}</strong>
              </div>
              <p>{fundamentalProfile.summary}</p>
            </div>
            <div className="fundamental-metric-grid">
              {fundamentalProfile.metrics?.slice(0, 6).map((metric) => (
                <article key={metric.name}>
                  <div>
                    <span>{metric.name}</span>
                  <b>{normalizeDataCopy(metric.status)}</b>
                </div>
                  <strong>{normalizeDataCopy(metric.value)}</strong>
                  <p>{normalizeDataCopy(metric.note)}</p>
                </article>
              ))}
            </div>
            <div className="fundamental-impact">
              <span>对持仓的影响</span>
              <p>{normalizeDataCopy(fundamentalProfile.holdingImpact)}</p>
            </div>
            <div className="fundamental-profile-lists">
              <div>
                <span>已有依据</span>
                {fundamentalProfile.strengths?.slice(0, 2).map((item) => <p key={item}>{normalizeDataCopy(item)}</p>)}
              </div>
              <div>
                <span>继续跟踪</span>
                {fundamentalProfile.nextData?.slice(0, 3).map((item) => <p key={item}>{normalizeDataCopy(item)}</p>)}
              </div>
            </div>
            {fundamentalProfile.risks?.length > 0 && (
              <div className="fundamental-risk-list">
                <span>资料风险</span>
                {fundamentalProfile.risks.slice(0, 2).map((item) => <p key={item}>{normalizeDataCopy(item)}</p>)}
              </div>
            )}
            <small>{fundamentalProfile.compliance}</small>
          </div>
        </details>
      )}

      {forecast && (
        <div className="forecast-card">
          <div className="forecast-card__head">
            <div>
              <span>走势概率</span>
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
              <span>关键价位</span>
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
              <span>观察点和风险</span>
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
              <span>模型因子</span>
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
          <span>评分明细</span>
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
            <span>数据质量</span>
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
            <span>行业模型</span>
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
            <span>合规说明</span>
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
            <span>持仓规则</span>
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
          <span>系统分析</span>
          <ChevronRight size={17} />
        </summary>
        <div className="decision-copy">
          <span>系统分析</span>
          <p>{normalizeDataCopy(decision.systemAnalysis)}</p>
        </div>
      </details>

      {newsImpact?.items?.length ? (
        <details className="analysis-disclosure">
          <summary>
            <span>新闻影响</span>
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
        </div>
      </details>
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
    (a, b) => stockDayMove(b) - stockDayMove(a),
  )
  const topGainers = rankedStocks.slice(0, 5)
  const topLosers = [...displayMarketStocks]
    .sort((a, b) => stockDayMove(a) - stockDayMove(b))
    .slice(0, 5)
  const maxMove = Math.max(
    ...[...topGainers, ...topLosers].map((stock) => Math.abs(stockDayMove(stock))),
    1,
  )
  const leader = rankedStocks[0]
  const focusPool = [
    ...pricedMarketStocks,
    ...Object.values(stocks).filter((stock) => stock.market === 'cn' && hasLivePrice(stock)),
  ]
  const focusStocks = Array.from(new Map(focusPool.map((stock) => [stock.code, stock])).values())
    .sort((a, b) => {
      const aScore = stockDayMove(a) * 1.6 + stockMonthMove(a) * 0.8 + a.score / 20
      const bScore = stockDayMove(b) * 1.6 + stockMonthMove(b) * 0.8 + b.score / 20
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
                <em className={trendClass(stockDayMove(stock))}>
                  {displayStockMove(stock)}
                </em>
                <p>
                  <span>现价 {displayStockPrice(stock)}</span>
                  <span>{stockDayMove(stock) >= 0 ? '今日上涨' : '今日下跌'}</span>
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
                <em className={trendClass(stockDayMove(stock))}>
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
        const move = stockDayMove(stock)
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
              <span>{stock.code} · {hasLivePrice(stock) ? `¥${stock.price}/股` : '行情同步中'}</span>
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
  const values = Array.isArray(points) && points.length > 1 ? points : [0, 0]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const coordinates = values
    .map((point, index) => {
      const x = (index / (values.length - 1)) * width
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
      volumeSignal: '成交量积累中',
      trendSignal: '均线积累中',
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
      : '成交量积累中',
    trendSignal: ma5 && ma20
      ? ma5 >= ma20
        ? '短线在中期均线上方'
        : '短线仍在中期均线下方'
      : '均线积累中',
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
        <strong className={hasStatValue(levels.support) ? '' : 'is-pending'}>{formatStatValue(levels.support, '', 'history')}</strong>
      </div>
      <div>
        <span>压力位</span>
        <strong className={hasStatValue(levels.resistance) ? '' : 'is-pending'}>{formatStatValue(levels.resistance, '', 'history')}</strong>
      </div>
      <p>{levels.trendSignal}，{levels.volumeSignal}。</p>
    </div>
  )
}

function StockStatsGrid({ stock, candles = null }) {
  const stats = buildStockStats(stock, candles)

  return (
    <div className="stock-stats-grid" aria-label={`${stock.name}关键行情数据`}>
      {stats.map(([label, value, kind]) => (
        <div key={label}>
          <span>{label}</span>
          <strong className={hasStatValue(value) ? '' : 'is-pending'}>{formatStatValue(value, '', kind)}</strong>
        </div>
      ))}
    </div>
  )
}

function KLineView({ stock, setActiveTab, returnTab, candles }) {
  const displayCandles = candles?.length ? candles : stock.klineRows?.length ? stock.klineRows : buildKLineData(stock)
  const dataQuality = stock.dataQuality ?? stock.analysisScore?.dataQuality
  const sourceTrust = stock.sourceTrust ?? dataQuality?.sourceTrust
  const quoteSource = stock.quoteStats?.source ?? stock.quote?.source ?? '行情同步中'
  const klineSource = stock.klineSource ?? stock.historyProvider ?? (stock.dataCoverage?.history ? '历史K线' : '样本积累中')
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
            <strong className={trendClass(stockDayMove(stock))}>
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
  buyHolding,
  sellHolding,
  removeHolding,
  setActiveTab,
  setKlineReturnTab,
  setSelectedCode,
  setQuery,
}) {
  const [tradeDraft, setTradeDraft] = useState({
    code: '',
    action: 'buy',
    amount: '',
    shares: '',
    price: '',
  })
  const [tradeNotice, setTradeNotice] = useState('')
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false)
  const topHolding = portfolio.reduce((top, item) => ((item.marketValue ?? item.amount) > (top.marketValue ?? top.amount) ? item : top), portfolio[0])
  const portfolioDayGain = portfolio.reduce((sum, item) => sum + (item.dayGain ?? 0), 0)
  const totalCost = portfolio.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const totalGain = portfolio.reduce((sum, item) => sum + (item.totalGain ?? 0), 0)
  const totalGainRate = totalCost ? (totalGain / totalCost) * 100 : 0
  const selectedTradeHolding = portfolio.find((item) => item.code === tradeDraft.code)
  const capital = portfolioInsights?.summary?.capital ?? {}
  const ledgerHoldingCost = capital.holdingCost ?? totalCost
  const ledgerMarketValue = capital.marketValue ?? totalAmount
  const ledgerUnrealizedGain = capital.unrealizedGain ?? totalGain
  const ledgerRealizedGain = capital.realizedGain ?? 0
  const ledgerTotalGain = capital.totalGain ?? totalGain
  const ledgerTotalGainRate = capital.totalGainRate ?? totalGainRate
  const ledgerPortfolioReturnRate = capital.portfolioReturnRate ?? ledgerTotalGainRate
  const ledgerRealizedGainRate = capital.realizedGainRate ?? 0
  const ledgerDayGain = capital.dayGain ?? portfolioDayGain
  const ledgerAccountValue = capital.accountValue ?? ledgerMarketValue + Number(capital.totalSellAmount ?? 0)
  const ledgerTotalBuyAmount = capital.totalBuyAmount ?? ledgerHoldingCost
  const ledgerAvailableCash = capital.availableCash ?? capital.totalSellAmount ?? 0
  const netCashInvested = capital.netCashInvested ?? ledgerHoldingCost
  const recoveredPrincipal = capital.recoveredPrincipal ?? 0
  const capitalUtilizationRate = capital.capitalUtilizationRate ?? (ledgerTotalBuyAmount ? ledgerHoldingCost / ledgerTotalBuyAmount * 100 : 0)
  const capitalTips = buildCapitalTips(capital, portfolio)
  const cashMultiple = capital.marketToCostRatio ?? (ledgerHoldingCost ? ledgerMarketValue / ledgerHoldingCost : 0)
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
  const tradeActionLabel = tradeDraft.action === 'sell' ? '卖出' : '买入'

  function openTradePanel(item, action = 'buy') {
    const price = Number(item.currentPrice || item.costPrice || 0)
    setTradeNotice('')
    setTradeDraft({
      code: item.code,
      action,
      amount: action === 'buy' ? '10000' : '',
      shares: '',
      price: price > 0 ? String(price) : '',
    })
  }

  async function submitTrade(event) {
    event.preventDefault()
    if (!selectedTradeHolding) return
    const amount = Number(tradeDraft.amount)
    const shares = Number(tradeDraft.shares)
    const price = Number(tradeDraft.price)
    if (tradeDraft.action === 'buy' && (!amount || amount <= 0) && (!shares || shares <= 0)) {
      setTradeNotice('买入需要填写金额或股数。')
      return
    }
    if (tradeDraft.action === 'buy' && (!amount || amount <= 0) && shares > 0 && (!price || price <= 0)) {
      setTradeNotice('按股数买入时需要填写成交价。')
      return
    }
    if (tradeDraft.action === 'sell' && (!shares || shares <= 0) && (!amount || amount <= 0)) {
      setTradeNotice('卖出需要填写股数或金额。')
      return
    }
    setIsSubmittingTrade(true)
    setTradeNotice('')
    try {
      if (tradeDraft.action === 'sell') {
        await sellHolding(selectedTradeHolding.code, {
          amount: amount > 0 ? amount : undefined,
          shares: shares > 0 ? shares : undefined,
          price: price > 0 ? price : undefined,
          note: '持仓页卖出',
        })
      } else {
        await buyHolding(selectedTradeHolding.code, amount > 0 ? amount : Math.round(shares * price), {
          shares: shares > 0 ? shares : undefined,
          costPrice: price > 0 ? price : undefined,
        })
      }
      setTradeNotice(`${selectedTradeHolding.name}已记录${tradeActionLabel}。`)
      setTradeDraft({ code: '', action: 'buy', amount: '', shares: '', price: '' })
    } catch {
      setTradeNotice(`${tradeActionLabel}失败，请确认后端和行情价格是否可用。`)
    } finally {
      setIsSubmittingTrade(false)
    }
  }
  const tradeAmountPreview = Number(tradeDraft.amount)
  const tradeSharesPreview = Number(tradeDraft.shares)
  const tradePricePreview = Number(tradeDraft.price)
  const tradeEstimatedAmount = tradeAmountPreview > 0
    ? tradeAmountPreview
    : tradeSharesPreview > 0 && tradePricePreview > 0
      ? tradeSharesPreview * tradePricePreview
      : 0

  return (
    <div className="view-stack">
      <section className="portfolio-summary">
        <p className="caption">持仓账户</p>
        <strong>{currency(ledgerAccountValue)}</strong>
        <span>
          当前市值 {currency(ledgerMarketValue)}
          {' '}·{' '}
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

      <section className="panel capital-ledger">
        <div className="section-title split">
          <div>
            <BriefcaseBusiness size={18} />
            <h2>本金收益</h2>
          </div>
          <span>{capital.transactionCount ? `${capital.transactionCount} 笔流水` : `${portfolio.length} 只持仓`}</span>
        </div>
        <div className="capital-ledger-hero">
          <div>
            <span>总收益</span>
            <strong className={ledgerTotalGain >= 0 ? 'is-up' : 'is-down'}>
              {currency(ledgerTotalGain)}
            </strong>
            <em>{formatPercent(ledgerPortfolioReturnRate)}</em>
          </div>
          <p>
            未实现收益 {currency(ledgerUnrealizedGain)}，已实现收益 {currency(ledgerRealizedGain)}。
            系统按平均成本估算，不连接真实券商账户。
          </p>
        </div>
        <div className="capital-grid">
          <div>
            <span>总投入本金</span>
            <strong>{currency(ledgerTotalBuyAmount)}</strong>
          </div>
          <div>
            <span>当前市值</span>
            <strong>{currency(ledgerMarketValue)}</strong>
          </div>
          <div>
            <span>未实现收益</span>
            <strong className={ledgerUnrealizedGain >= 0 ? 'is-up' : 'is-down'}>
              {currency(ledgerUnrealizedGain)}
            </strong>
          </div>
          <div>
            <span>卖出回收现金</span>
            <strong>{currency(ledgerAvailableCash)}</strong>
            <em>已实现 {formatPercent(ledgerRealizedGainRate)}</em>
          </div>
        </div>
        <div className="capital-tips">
          {capitalTips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </div>
        <div className="capital-flow">
          <div>
            <span>累计买入</span>
            <strong>{currency(capital.totalBuyAmount ?? ledgerHoldingCost)}</strong>
          </div>
          <div>
            <span>累计卖出</span>
            <strong>{currency(capital.totalSellAmount ?? 0)}</strong>
          </div>
          <div>
            <span>净投入</span>
            <strong>{currency(netCashInvested)}</strong>
          </div>
          <div>
            <span>已释放本金</span>
            <strong>{currency(recoveredPrincipal)}</strong>
          </div>
        </div>
        <div className="capital-foot">
          <span>本金使用率 {formatPercent(capitalUtilizationRate)}</span>
          <strong className={ledgerDayGain >= 0 ? 'is-up' : 'is-down'}>
            今日 {currency(ledgerDayGain)}
          </strong>
          <em>市值/本金 {cashMultiple ? cashMultiple.toFixed(2) : '0.00'}x</em>
        </div>
        <details className="capital-method">
          <summary>
            <span>收益怎么计算</span>
            <ChevronRight size={16} />
          </summary>
          <p>{capital.method ?? '买入增加持仓本金；卖出按平均成本释放本金，卖出金额减释放成本为已实现收益。'}</p>
        </details>
      </section>

      <section className="panel portfolio-insight-card">
        <div className="section-title split">
          <div>
            <ShieldAlert size={18} />
            <h2>组合诊断</h2>
          </div>
          <span>{portfolioInsights?.riskLabel ?? '组合评估中'}</span>
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
        <details className="panel portfolio-risk-engine">
          <summary>
            <span>
              <BarChart3 size={18} />
              高级风险
            </span>
            <em>分散度 {riskEngine.diversificationScore}</em>
            <ChevronRight size={17} />
          </summary>
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
            <div>
              <span>年化波动</span>
              <strong>{riskEngine.weightedAnnualVolatility ?? 0}%</strong>
            </div>
            <div>
              <span>有效持仓</span>
              <strong>{riskEngine.effectivePositions ?? 0}</strong>
            </div>
            <div>
              <span>数据置信度</span>
              <strong>{riskEngine.dataConfidence?.label ?? '评估中'}</strong>
            </div>
          </div>
          <div className="risk-engine-notes">
            {riskEngine.notes?.slice(0, 3).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
          {riskEngine.factorScores?.length > 0 && (
            <div className="risk-factor-list">
              {riskEngine.factorScores.map((factor) => (
                <div key={factor.id}>
                  <span>{factor.name}</span>
                  <strong>{factor.score}</strong>
                  <p>{factor.text}</p>
                </div>
              ))}
            </div>
          )}
          {riskEngine.highRiskPositions?.length > 0 && (
            <div className="high-risk-position-list">
              <strong>优先检查</strong>
              {riskEngine.highRiskPositions.map((item) => (
                <p key={`${item.code}-${item.reason}`}>
                  {item.name} {item.positionRatio}%：{item.reason}
                </p>
              ))}
            </div>
          )}
        </details>
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
            建议复盘
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
            {concentration.industry === '未分类持仓'
              ? '部分持仓还缺少行业标签，系统会在数据同步后重新计算分类分布。'
              : `${concentration.industry} 是当前占比最高的分类。`}
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
                <em className={trendClass(stockDayMove(stock))}>
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
            <div className="holding-trade-actions">
              <button type="button" onClick={() => openTradePanel(item, 'buy')}>
                买入
              </button>
              <button type="button" onClick={() => openTradePanel(item, 'sell')}>
                卖出
              </button>
            </div>
            {tradeDraft.code === item.code && (
              <form className="inline-trade-form" onSubmit={submitTrade}>
                <div className="trade-segment">
                  <button
                    className={tradeDraft.action === 'buy' ? 'is-active' : ''}
                    type="button"
                    onClick={() => openTradePanel(item, 'buy')}
                  >
                    买入
                  </button>
                  <button
                    className={tradeDraft.action === 'sell' ? 'is-active' : ''}
                    type="button"
                    onClick={() => openTradePanel(item, 'sell')}
                  >
                    卖出
                  </button>
                </div>
                <div className="trade-input-grid">
                  <input
                    inputMode="decimal"
                    placeholder={tradeDraft.action === 'sell' ? '卖出金额' : '买入金额'}
                    value={tradeDraft.amount}
                    onChange={(event) =>
                      setTradeDraft((value) => ({
                        ...value,
                        amount: event.target.value.replace(/[^\d.]/g, ''),
                      }))
                    }
                  />
                  <input
                    inputMode="numeric"
                    placeholder={tradeDraft.action === 'sell' ? '卖出股数' : '买入股数'}
                    value={tradeDraft.shares}
                    onChange={(event) =>
                      setTradeDraft((value) => ({
                        ...value,
                        shares: event.target.value.replace(/[^\d]/g, ''),
                      }))
                    }
                  />
                  <input
                    inputMode="decimal"
                    placeholder="成交价"
                    value={tradeDraft.price}
                    onChange={(event) =>
                      setTradeDraft((value) => ({
                        ...value,
                        price: event.target.value.replace(/[^\d.]/g, ''),
                      }))
                    }
                  />
                </div>
                <div className="trade-form-actions">
                  <button type="submit" disabled={isSubmittingTrade}>
                    {isSubmittingTrade ? '记录中' : `确认${tradeActionLabel}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTradeDraft({ code: '', action: 'buy', amount: '', shares: '', price: '' })
                      setTradeNotice('')
                    }}
                  >
                    取消
                  </button>
                </div>
                <div className="trade-preview">
                  <span>
                    {tradeDraft.action === 'sell'
                      ? `可卖 ${item.shares} 股`
                      : `当前成本 ${formatStatValue(item.costPrice)}`}
                  </span>
                  <strong>
                    {tradeEstimatedAmount > 0 ? `预计${tradeActionLabel} ${currency(tradeEstimatedAmount)}` : '填写后自动估算'}
                  </strong>
                </div>
                {tradeNotice && <p>{tradeNotice}</p>}
              </form>
            )}
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
  systemMonitor,
  isSavingUserProfile,
  saveUserProfile,
  authSession,
  authNotice,
  loginWithApple,
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
            <strong>{dataStatus?.sourceTrust?.label ?? dataStatus?.source ?? '同步中'}</strong>
          </div>
          <div>
            <span>未读通知</span>
            <strong>{stats.unreadAlerts ?? 0}</strong>
          </div>
        </div>
      </section>

      {(systemStatus || systemMonitor) && (
        <OperationalMonitorCard systemMonitor={systemMonitor} systemStatus={systemStatus} />
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
          <a href="/support.html" target="_blank" rel="noreferrer">
            支持中心
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
        loginWithApple={loginWithApple}
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

function OperationalMonitorCard({ systemMonitor, systemStatus }) {
  const score = systemMonitor?.score ?? (systemStatus?.status === 'ready' ? 90 : systemStatus?.status === 'needs_config' ? 72 : 50)
  const launch = systemStatus?.launch
  const launchPercent = launch?.percent ?? 0
  const launchStatusLabel = launch?.status === 'ready_for_review'
    ? '可准备审核'
    : launch?.status === 'nearly_ready'
      ? '接近可上线'
      : '上线前待处理'
  const statusLabel = systemMonitor?.status === 'healthy'
    ? '运行正常'
    : systemMonitor?.status === 'degraded'
      ? '需要关注'
      : '需要处理'
  const dataSignal = systemMonitor?.signals?.data
  const taskSignal = systemMonitor?.signals?.tasks
  const errorSignal = systemMonitor?.signals?.errors
  const databaseSignal = systemMonitor?.signals?.database ?? systemStatus?.checks?.database
  const uptime = formatDuration(systemMonitor?.environment?.uptimeSeconds)
  const monitorRows = [
    {
      label: '数据库',
      ok: databaseSignal?.ok,
      value: databaseSignal?.stockCount ? `${databaseSignal.stockCount} 只股票` : systemMonitor?.environment?.database ?? '待检查',
    },
    {
      label: '行情',
      ok: dataSignal?.ok ?? systemStatus?.checks?.data?.ok,
      value: dataSignal?.ageMinutes === null || dataSignal?.ageMinutes === undefined
        ? '准备刷新'
        : `${dataSignal.ageMinutes} 分钟前`,
    },
    {
      label: '后台任务',
      ok: taskSignal?.ok ?? systemStatus?.checks?.tasks?.ok,
      value: taskSignal?.consecutiveFailures ? `${taskSignal.consecutiveFailures} 次失败` : `${taskSignal?.count ?? 0} 项正常`,
    },
    {
      label: '错误日志',
      ok: errorSignal?.ok ?? systemStatus?.checks?.errors?.ok,
      value: errorSignal?.recentCount ? `${errorSignal.recentCount} 条` : '无近期错误',
    },
  ]

  return (
    <section className="panel profile-panel ops-monitor">
      <div className="section-title split">
        <div>
          <ShieldAlert size={18} />
          <h2>运行监控</h2>
        </div>
        <span>{statusLabel}</span>
      </div>
      <div className="ops-monitor-hero">
        <div>
          <span>健康分</span>
          <strong className={score >= 85 ? 'is-ok' : score >= 65 ? 'is-warn' : 'is-bad'}>{score}</strong>
        </div>
        <p>
          后端已运行 {uptime}，当前为 {systemMonitor?.environment?.appEnv ?? 'development'} 环境。
          行情覆盖约 {dataSignal?.quoteCoverage ?? 0}%，历史 K 线覆盖约 {dataSignal?.historyCoverage ?? 0}%。
        </p>
      </div>
      {launch && (
        <div className="launch-readiness-card">
          <div className="launch-readiness-head">
            <div>
              <span>上线准备度</span>
              <strong>{launchPercent}%</strong>
            </div>
            <em>{launchStatusLabel}</em>
          </div>
          <div className="launch-progress-track" aria-label={`上线准备度 ${launchPercent}%`}>
            <span style={{ width: `${Math.max(4, Math.min(100, launchPercent))}%` }} />
          </div>
          <p>{launch.summary}</p>
          <div className="launch-next-step">
            <span>下一步</span>
            <strong>{launch.nextStep}</strong>
          </div>
          {launch.blocked?.length > 0 && (
            <div className="launch-gate-list">
              {launch.blocked.slice(0, 3).map((gate) => (
                <div key={gate.id}>
                  <span>{gate.label}</span>
                  <strong>{gate.summary}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="system-check-grid">
        {monitorRows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <strong className={row.ok ? 'is-ok' : 'is-warn'}>{row.ok ? '正常' : '检查'}</strong>
            <em>{row.value}</em>
          </div>
        ))}
      </div>
      <div className="ops-action-list">
        {(systemMonitor?.actionItems ?? ['等待后端返回监控建议。']).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
      {systemMonitor?.signals?.errors?.items?.length > 0 && (
        <div className="task-error-list">
          {systemMonitor.signals.errors.items.slice(0, 2).map((item) => (
            <div key={item.id}>
              <span>{item.path}</span>
              <strong>{item.message}</strong>
              <em>{item.createdAt}</em>
            </div>
          ))}
        </div>
      )}
    </section>
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
        text: 'Apple 或微信登录状态、观察股票、持仓金额、提醒规则和风险偏好会保存到后端，用于同步你的个人页面。',
      },
      {
        title: '不会做什么',
        text: '不会要求证券账户密码，不会自动下单，也不会把你的持仓显示给其他用户。',
      },
      {
        title: '后续上线要求',
        text: '隐私政策网页和数据删除入口已接入，正式上架前还需要补充运营主体、联系邮箱和第三方登录服务商说明。',
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
        text: '真实行情稳定性、历史 K 线、个性化建议记录、Apple 登录和微信登录还需要继续接入服务商。',
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
  loginWithApple,
  loginWithWechat,
  logoutUser,
}) {
  const [activeProvider, setActiveProvider] = useState('')
  const [localNotice, setLocalNotice] = useState('')

  async function handleProviderLogin(provider) {
    const login = provider === 'apple' ? loginWithApple : loginWithWechat
    setActiveProvider(provider)
    setLocalNotice('')
    try {
      await login()
    } catch (error) {
      const message = String(error?.message ?? '')
      if (message.includes('timed out')) {
        setLocalNotice('登录连接超时，请确认手机和电脑在同一个 Wi-Fi')
      } else if (message.includes('web preview')) {
        setLocalNotice('Apple 登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
      } else if (message.includes('已取消')) {
        setLocalNotice('已取消 Apple 登录。')
      } else if (message.includes('wechat native login unavailable')) {
        setLocalNotice('微信登录需要在 iPhone App 里使用；网页预览只展示上线入口。')
      } else if (message.includes('wechat not installed')) {
        setLocalNotice('当前设备未检测到微信，请安装微信后再试。')
      } else if (message.includes('wechat server not configured') || message.includes('OpenSDK')) {
        setLocalNotice('微信登录需要先完成微信开放平台移动应用配置；当前先保留入口。')
      } else {
        setLocalNotice(provider === 'apple'
          ? 'Apple 登录需要先在 Apple Developer 和 Xcode 开启 Sign in with Apple。'
          : '微信登录需要先完成微信开放平台配置。')
      }
    } finally {
      setActiveProvider('')
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
      <div className="auth-provider-list">
        <button
          className="auth-provider-button is-wechat"
          type="button"
          disabled={Boolean(activeProvider)}
          onClick={() => handleProviderLogin('wechat')}
        >
          <MessageCircle size={19} />
          <span>{activeProvider === 'wechat' ? '正在唤起微信登录' : '使用微信登录'}</span>
        </button>
        <button
          className="auth-provider-button is-apple"
          type="button"
          disabled={Boolean(activeProvider)}
          onClick={() => handleProviderLogin('apple')}
        >
          <Fingerprint size={19} />
          <span>{activeProvider === 'apple' ? '正在唤起 Apple 登录' : '使用 Apple 登录'}</span>
        </button>
      </div>
      <p className="auth-helper">
        登录后会同步你的持仓、观察池、提醒规则和风险偏好。手机号验证码已取消，首版只保留微信和 Apple 登录。
      </p>
      <div className="auth-status-strip" aria-label="登录配置状态">
        <span>微信审核中</span>
        <span>Apple 保留入口</span>
      </div>
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
  runDailyBackfill,
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
    free_fundamentals: {
      title: '基础字段',
      userText: '每天补企业市值、成交额、估值等公开字段。',
    },
    daily_data_backfill: {
      title: '每日补全',
      userText: '优先补持仓、观察池和常看股票的 K 线、行情和基础字段。',
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
              const dayMove = Number(stock.performance?.day ?? 0)
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
                  <Sparkline points={stock.sparkline} positive={dayMove >= 0} />
                  <strong className={`watch-change ${trendClass(dayMove)}`}>
                    {displayStockMove(stock)}
                  </strong>
                  <span>今日涨跌</span>
                </div>
                <div className="watch-reason">
                  <span>为什么关注</span>
                  <p>{normalizeDataCopy(watchDecision.trendView)}</p>
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

      <details className="panel system-tools-panel">
        <summary>
          <span>
            <Settings2 size={18} />
            <strong>系统工具</strong>
          </span>
          <em>{apiStatus === 'connected' ? '已连接' : '本地数据'}</em>
          <ChevronRight size={18} />
        </summary>
        <div className="system-tools-body">
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
            {dataStatus?.coverageSummary && (
              <div className="coverage-metrics">
                <div>
                  <span>行情</span>
                  <strong>{dataStatus.coverageSummary.quote?.ratio ?? 0}%</strong>
                </div>
                <div>
                  <span>K线</span>
                  <strong>{dataStatus.coverageSummary.history?.ratio ?? 0}%</strong>
                </div>
                <div>
                  <span>基本面</span>
                  <strong>{dataStatus.coverageSummary.fundamental?.ratio ?? 0}%</strong>
                </div>
              </div>
            )}
            {dataStatus?.dailyBackfill?.lastRefresh && (
              <div className="daily-backfill-card">
                <div>
                  <span>每日补全</span>
                  <strong>{dataStatus.dailyBackfill.syncedCount ?? 0} 只</strong>
                </div>
                <p>{dataStatus.dailyBackfill.message}</p>
                {dataStatus.dailyBackfill.scope && (
                  <p>
                    持仓 {dataStatus.dailyBackfill.scope.portfolioCount ?? 0} 只，
                    观察 {dataStatus.dailyBackfill.scope.watchlistCount ?? 0} 只，
                    最近分析 {dataStatus.dailyBackfill.scope.recentResearchCount ?? 0} 只
                  </p>
                )}
                <em>最近：{dataStatus.dailyBackfill.lastRefresh}</em>
              </div>
            )}
            {dataStatus?.sourceCapabilities?.length > 0 && (
              <div className="data-capability-list">
                {dataStatus.sourceCapabilities.slice(0, 4).map((source) => (
                  <article key={source.id}>
                    <span>{source.name}</span>
                    <strong>
                      {source.status === 'live'
                        ? '已接入'
                        : source.status === 'token-ready'
                          ? '可用'
                          : source.status === 'fallback'
                            ? '备用'
                            : source.status === 'free-cache'
                              ? '免费缓存'
                              : source.status === 'waiting'
                                ? '同步中'
                                : source.status}
                    </strong>
                    <p>{source.text}</p>
                    {source.refresh && <em>{source.refresh}</em>}
                  </article>
                ))}
              </div>
            )}
            {dataStatus?.lastRefresh && <em>最近刷新：{dataStatus.lastRefresh}</em>}
            <div className="data-action-row">
              <button type="button" onClick={refreshMarketData} disabled={isRefreshingData}>
                {isRefreshingData ? '刷新中...' : '刷新行情'}
              </button>
              <button type="button" onClick={runDailyBackfill} disabled={isRefreshingData}>
                {isRefreshingData ? '补全中...' : '每日补全'}
              </button>
            </div>
          </section>

          <section className="automation-panel">
            <div className="automation-hero">
              <strong>自动盯盘助手</strong>
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
          </section>
        </div>

        <details className="automation-list-detail">
          <summary>
            <span>后台任务</span>
            <em>{automationTasks.length} 项</em>
          </summary>
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
      </details>

      <section className="author-note">
        <span>Alex-w有话说</span>
        <p>
          股镜会先把搜索、持仓、观察和行情缓存做稳，再逐步完善更深的研究和通知能力。
        </p>
        <div>
          <strong>最近进度</strong>
          <ul>
            <li>已支持企业名称、关键词和代码搜索</li>
            <li>已支持持仓流水、观察提醒和每日免费数据补全</li>
            <li>下一步继续做真机稳定性、公开域名和通知服务</li>
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
        本工具仅做信息整理和风险观察，不构成证券投资建议。部分内容可能来自缓存或演示样本。
      </p>
    </aside>
  )
}

export default App
