import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  Bell,
  ChevronRight,
  Layers3,
  LineChart,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import homeScreen from '../assets/wechat-review-flow/01-home-market.png'
import searchScreen from '../assets/wechat-review-flow/03-search-suggestions.png'
import klineScreen from '../assets/wechat-review-flow/04-stock-kline-analysis.png'
import portfolioScreen from '../assets/wechat-review-flow/05-portfolio.png'
import './OfficialSite.css'

gsap.registerPlugin(ScrollTrigger)

const navItems = [
  { label: '功能介绍', path: '/official/features' },
  { label: '使用场景', path: '/official/scenarios' },
  { label: '后端能力', path: '/official/backend' },
  { label: '投研流程', path: '/official/research' },
  { label: '联系我们', path: '/official/contact' },
  { label: '隐私说明', path: '/official/privacy' },
]

const siteHighlights = [
  {
    label: '股票搜索',
    value: '全量 A 股名称库',
    icon: Search,
    button: '展开股票搜索说明',
    detail: '支持企业名称、简称、代码关键词搜索。用户不需要完整记住代码，也可以用“电气”“银行”“白酒”等关键词找到相关股票。',
    points: ['中文名称联想', '常搜股票记忆', '加入观察池或持仓'],
  },
  {
    label: '持仓分析',
    value: '本金、收益和集中度',
    icon: LineChart,
    button: '展开持仓分析说明',
    detail: '把本金、持仓金额、成本价和盈亏放在一起，结合行业分类、个股波动和组合集中度，提示是否需要降低单一股票或单一方向的风险。',
    points: ['本金收益合并展示', '行业集中度判断', '仓位风险提醒'],
  },
  {
    label: '新闻波动',
    value: '公告与行情异动提示',
    icon: Bell,
    button: '展开新闻波动说明',
    detail: '把公告、新闻关键词和行情异动整理成波动线索，帮助用户知道哪些股票可能因为消息面出现更大波动。',
    points: ['公告更新关注', '新闻关键词整理', '波动原因摘要'],
  },
  {
    label: '合规边界',
    value: '研究辅助，不做买卖承诺',
    icon: ShieldCheck,
    button: '展开风险边界说明',
    detail: '股镜只做信息整理和风险观察，不承诺收益，不直接替用户做买卖决定。页面会持续提示研究辅助和风险边界。',
    points: ['不承诺收益', '不替代投顾意见', '支持隐私与联系入口'],
  },
]

const proofMetrics = [
  ['面向', 'A 股研究', '围绕名称搜索、行情、K 线和持仓建议组织信息。'],
  ['15 分钟', '市场概况刷新', '市场概览和首页推荐按行情状态定期更新。'],
  ['三层', '风险框架', '价格走势、新闻波动、组合集中度同时检查。'],
  ['研究优先', '不做收益承诺', '强调信息整理与风险观察，不替代持牌投顾意见。'],
]

const tickerItems = [
  '企业名称搜索',
  'A 股行情同步',
  'K 线走势',
  '新闻波动线索',
  '公告影响摘要',
  '持仓风险评分',
  '观察池提醒',
  '隐私政策可查',
]

const workflow = [
  {
    title: '先找股票',
    text: '从关键词开始，不强迫用户先记住代码。',
    steps: [
      '输入股票代码、企业名称或行业关键词。',
      '系统展示匹配股票、企业名称和行情状态。',
      '用户可以继续分析，也可以加入观察池或持仓。',
    ],
    image: searchScreen,
    alt: '股镜股票名称搜索和候选股票列表',
  },
  {
    title: '再看走势',
    text: '把价格、K 线和风险摘要放到同一张研究页。',
    steps: [
      '打开个股详情后先看实时价、涨跌幅和更新时间。',
      '再看 K 线、开盘价、昨日收盘价和历史区间。',
      '最后阅读系统分析，判断短期波动和未来一个月走势。',
    ],
    image: klineScreen,
    alt: '股镜个股 K 线和分析页面',
  },
  {
    title: '最后检查持仓',
    text: '把单只股票判断升级成组合风险判断。',
    steps: [
      '填写持仓金额、股数或成本价。',
      '系统计算本金、收益、持仓集中度和行业分类。',
      '当个股或行业过度集中时，提示用户先观察或降低风险。',
    ],
    image: portfolioScreen,
    alt: '股镜持仓收益和组合风险页面',
  },
]

const marketRows = [
  ['600519', '贵州茅台', '+0.84%'],
  ['000001', '平安银行', '+0.19%'],
  ['300750', '宁德时代', '-1.12%'],
  ['601727', '上海电气', '+2.31%'],
]

const audience = [
  ['个人投资者', '想在买入或卖出前，把行情、K 线和新闻线索看清楚。'],
  ['刚入门用户', '不用先懂复杂指标，也可以从股票名称和风险提示开始。'],
  ['小型研究团队', '把观察池、持仓和研究摘要沉淀成统一流程。'],
]

const scenarios = [
  {
    title: '新手不知道股票代码',
    tag: '从名称开始',
    text: '直接输入企业名称、简称或行业关键词，先找到相关 A 股，再决定要不要进入个股分析。',
    actions: ['输入“电气”“石油”“银行”等关键词', '查看候选企业名称和代码', '选择加入观察池或继续分析'],
  },
  {
    title: '已有持仓想看风险',
    tag: '本金和仓位',
    text: '把持仓金额、股数、成本价和当前行情放在一起，看今日盈亏、组合集中度和是否适合继续重仓。',
    actions: ['录入持仓金额或股数', '检查本金收益和行业分类', '根据集中度提示调整观察重点'],
  },
  {
    title: '担心消息面带来波动',
    tag: '新闻和公告',
    text: '把公告、新闻关键词和行情异动整理成波动线索，帮助用户知道近期为什么需要更谨慎。',
    actions: ['查看新闻波动摘要', '关注公告或财报更新', '结合 K 线确认是否已经反映'],
  },
  {
    title: '想长期跟踪几只股票',
    tag: '观察池',
    text: '把暂时不买但想继续看的股票放进观察池，后续用涨跌、新闻和 K 线变化提醒重新检查。',
    actions: ['加入观察池', '设置系统通知', '定期查看走势和研究理由'],
  },
]

const backendPipeline = [
  ['数据接入层', '股票目录、实时行情、历史 K 线、公告新闻和持仓记录先进入后端。'],
  ['分析计算层', '计算涨跌、趋势、波动、行业集中度、组合风险和新闻影响线索。'],
  ['展示输出层', '把结果转成用户能读懂的持仓建议、未来走势推断和风险说明。'],
]

const homeAdvantages = [
  ['找得到', '用企业名称、简称、代码和行业关键词搜索 A 股，不要求用户先记住完整代码。'],
  ['看得懂', '把实时价格、K 线、新闻波动和持仓风险拆成用户能逐项检查的模块。'],
  ['有边界', '所有建议都说明依据和风险，不承诺收益，不替代持牌投顾意见。'],
]

const dashboardNotes = [
  'AI 研究摘要',
  '财务健康评分',
  '估值区间',
  '新闻影响',
  '风险信号',
  '观察池提醒',
]

const backendLayers = [
  {
    title: 'A 股名称与代码目录',
    status: '已接入',
    text: '后端维护完整 A 股名称库，支持代码、企业名称、简称和关键词搜索。用户输入“电气”“银行”“石油”等词时，会先从目录层返回相关股票。',
    points: ['企业名称搜索', '关键词匹配', '常搜股票记忆'],
  },
  {
    title: '实时行情与缓存',
    status: '持续优化',
    text: '行情层优先读取实时或延迟行情，并把结果缓存到后端。这样 App 打开后能尽快显示价格、涨跌幅和更新时间，减少“待补充”的感觉。',
    points: ['价格与涨跌幅', '15 分钟概览刷新', '失败后自动降级'],
  },
  {
    title: '历史 K 线补全',
    status: '多源兜底',
    text: 'K 线用于判断趋势、波动和回撤。后端会优先使用稳定数据源，缺失时尝试备用来源，并把可用结果保存下来。',
    points: ['日线走势', '区间高低点', '趋势与波动信号'],
  },
  {
    title: '新闻与波动线索',
    status: '模型建设中',
    text: '新闻层会把公告、行业消息和关键词变化整理成波动线索，帮助用户知道某只股票近期为什么可能出现更大波动。',
    points: ['公告关注', '行业关键词', '波动原因摘要'],
  },
  {
    title: '持仓风险模型',
    status: '已展示',
    text: '持仓层结合本金、持仓金额、个股走势、行业分类和集中度，给出更有针对性的风险提示，而不是只看某只股票涨跌。',
    points: ['本金收益', '行业集中度', '仓位建议'],
  },
  {
    title: '合规与说明边界',
    status: '上线前必备',
    text: '所有分析都定位为信息整理和风险观察。后端会保留必要记录，方便解释建议来源，同时避免把内容写成收益承诺。',
    points: ['不承诺收益', '记录分析来源', '隐私政策可查'],
  },
]

function getPageKey() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path.endsWith('/features')) return 'features'
  if (path.endsWith('/scenarios')) return 'scenarios'
  if (path.endsWith('/backend')) return 'backend'
  if (path.endsWith('/research')) return 'research'
  if (path.endsWith('/contact')) return 'contact'
  if (path.endsWith('/privacy')) return 'privacy'
  return 'home'
}

function SiteLogo() {
  return (
    <svg viewBox="0 0 42 42" role="img" aria-label="股镜 Logo">
      <path className="site-logo-lens" d="M20.5 6.5a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z" />
      <path className="site-logo-handle" d="M30.5 30.5 36 36" />
      <path className="site-logo-base" d="M10.5 29.5h19.5" />
      <path className="site-logo-candle" d="M14.5 25V15M14.5 20h4.8M21.5 27V11.5M21.5 16.5h5.2M28.5 23.5V14.5M28.5 19h4" />
    </svg>
  )
}

function SiteNav({ pageKey }) {
  return (
    <nav className="site-nav" aria-label="股镜官网导航" data-site-intro data-site-animate>
      <a className="site-brand" href="/official" aria-label="股镜官网首页">
        <span>
          <SiteLogo />
        </span>
        <strong>股镜</strong>
      </a>
      <div className="site-nav-links">
        {navItems.map((item) => (
          <a
            className={item.path.endsWith(pageKey) ? 'is-active' : ''}
            href={item.path}
            key={item.path}
          >
            {item.label}
          </a>
        ))}
      </div>
      <a className="site-nav-cta" href="/">打开应用</a>
    </nav>
  )
}

function HeroVisual() {
  return (
    <div className="site-hero-visual" aria-label="股镜智能投研仪表盘预览">
      <div className="site-dashboard-shell" data-site-intro data-site-animate data-site-float>
        <div className="site-dashboard-head">
          <span>股镜研究面板</span>
          <strong>A 股市场监看</strong>
        </div>
        <div className="site-market-board">
          <div className="site-market-board-head">
            <span>实时</span>
            <strong>今日值得关注</strong>
          </div>
          <div className="site-market-board-lines">
            {marketRows.map(([code, name, change]) => (
              <div className="site-market-row" key={code} data-site-board-row>
                <span>{code}</span>
                <strong>{name}</strong>
                <em className={change.startsWith('-') ? 'is-down' : 'is-up'}>{change}</em>
              </div>
            ))}
          </div>
          <div className="site-scanline" data-site-scanline />
        </div>
        <div className="site-ai-summary">
          <Sparkles size={18} />
          <div>
            <strong>AI 摘要</strong>
            <p>市场偏弱时，先确认价格企稳、公告变化和持仓集中度，再决定是否继续观察。</p>
          </div>
        </div>
      </div>
      <div className="site-phone-stack" data-site-intro data-site-animate data-site-float>
        <img src={homeScreen} alt="股镜首页市场监看和今日关注股票" />
        <img src={klineScreen} alt="股镜个股 K 线和分析页面" />
      </div>
    </div>
  )
}

function ProofGrid() {
  return (
    <section className="site-proof-grid" aria-label="股镜核心指标">
      {proofMetrics.map(([value, label, text]) => (
        <article key={label} data-site-card data-site-animate>
          <strong>{value}</strong>
          <span>{label}</span>
          <p>{text}</p>
        </article>
      ))}
    </section>
  )
}

function Ticker() {
  return (
    <section className="site-ticker" aria-label="股镜数据能力">
      <div className="site-ticker-track" data-site-tape>
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </section>
  )
}

function HomeAdvantageGrid() {
  return (
    <section className="site-home-section" aria-label="股镜首页亮点">
      <div className="site-section-heading" data-site-card data-site-animate>
        <span>产品亮点</span>
        <h2>把股票研究从“看一堆数据”变成“按问题检查”。</h2>
        <p>股镜首页会优先呈现用户最容易理解的价值：找得到股票、看得懂变化、知道风险边界。</p>
      </div>
      <div className="site-advantage-grid">
        {homeAdvantages.map(([title, text], index) => (
          <article className="site-advantage-card" key={title} data-site-card data-site-animate>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HomeScenarioPreview() {
  return (
    <section className="site-home-scenarios" aria-label="股镜使用场景预览" data-site-card data-site-animate>
      <div className="site-home-scenarios-copy">
        <span>怎么用</span>
        <h2>从一个具体问题开始，不用先学复杂指标。</h2>
        <p>用户可以从搜索股票、检查持仓、关注新闻波动或观察池跟踪进入。每个场景背后都会调用行情、K 线、新闻和持仓模型。</p>
        <a className="site-secondary-action" href="/official/scenarios">查看使用场景</a>
      </div>
      <div className="site-mini-scenario-list">
        {scenarios.map((scenario) => (
          <a href="/official/scenarios" key={scenario.title}>
            <strong>{scenario.title}</strong>
            <span>{scenario.tag}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function HomeBackendPreview() {
  return (
    <section className="site-home-backend" aria-label="股镜后端分析能力预览">
      <div className="site-section-heading" data-site-card data-site-animate>
        <span>分析后端</span>
        <h2>股镜的重点不是只做漂亮界面，而是把数据整理成可解释的建议。</h2>
        <p>后端把股票目录、实时行情、历史 K 线、新闻线索和持仓记录串起来，最后输出用户能看懂的风险提示。</p>
      </div>
      <div className="site-pipeline site-home-pipeline" aria-label="首页后端管线预览">
        {backendPipeline.map(([title, text], index) => (
          <article className="site-pipeline-card" key={title} data-site-card data-site-animate>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <a className="site-inline-link" href="/official/backend">
        了解后端如何生成分析
        <ChevronRight size={17} />
      </a>
    </section>
  )
}

function FeatureCards() {
  return (
    <div className="site-highlight-grid">
      {siteHighlights.map((item) => {
        const Icon = item.icon
        return (
          <article className="site-highlight" key={item.label} data-site-card data-site-animate>
            <div className="site-highlight-top">
              <Icon size={22} />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
            <details className="site-feature-detail">
              <summary role="button" aria-label={item.button}>
                {item.button}
                <ChevronRight size={16} />
              </summary>
              <div>
                <p>{item.detail}</p>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </details>
          </article>
        )
      })}
    </div>
  )
}

function WorkflowSection({ activeStep, setActiveStep }) {
  const selectedWorkflow = workflow[activeStep]

  return (
    <section className="site-flow" aria-label="股镜使用流程">
      <div className="site-flow-heading" data-site-card data-site-animate>
        <span>投研流程</span>
        <h2>从搜索到持仓，三步把判断补完整。</h2>
        <p>流程页专门解释用户如何从原始行情走到结构化判断，避免首页一次性放太多内容。</p>
      </div>
      <div className="site-workflow-layout" data-site-card data-site-animate>
        <div className="site-workflow-tabs" role="tablist" aria-label="投研流程步骤">
          {workflow.map((item, index) => (
            <button
              aria-selected={activeStep === index}
              className={activeStep === index ? 'is-active' : ''}
              key={item.title}
              onClick={() => setActiveStep(index)}
              role="tab"
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.title}
            </button>
          ))}
        </div>
        <article className="site-workflow-panel" role="tabpanel">
          <div>
            <p>{selectedWorkflow.text}</p>
            <details className="site-flow-detail">
              <summary role="button" aria-label={`查看${selectedWorkflow.title}完整步骤`}>
                查看完整步骤
                <ChevronRight size={16} />
              </summary>
              <ol>
                {selectedWorkflow.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
          </div>
          <img src={selectedWorkflow.image} alt={selectedWorkflow.alt} />
        </article>
      </div>
    </section>
  )
}

function HomePage() {
  return (
    <>
      <section className="site-hero">
        <div className="site-hero-copy">
          <p className="site-kicker" data-site-intro data-site-animate>AI 智能股票研究平台</p>
          <h1 data-site-intro data-site-animate>股镜</h1>
          <p className="site-hero-line" data-site-intro data-site-animate>
            把股票信息整理成可检查的风险框架
          </p>
          <p className="site-hero-text" data-site-intro data-site-animate>
            面向刚进入股票市场的用户，整理 A 股搜索、行情、K 线、持仓、新闻波动和组合风险，帮助你在行动前多看一层风险。
          </p>
          <div className="site-actions" data-site-intro data-site-animate>
            <a className="site-primary-action" href="/">
              打开应用
              <ChevronRight size={18} />
            </a>
            <a className="site-secondary-action" href="/official/research">查看投研流程</a>
            <a className="site-secondary-action" href="/official/privacy">查看隐私政策</a>
          </div>
          <p className="site-risk-inline" data-site-intro data-site-animate>
            研究辅助，不构成证券投资建议。投资有风险，请基于自己的判断做决定。
          </p>
        </div>
        <HeroVisual />
      </section>

      <ProofGrid />
      <Ticker />
      <HomeAdvantageGrid />
      <HomeScenarioPreview />
      <HomeBackendPreview />

      <section className="site-page-links" aria-label="官网页面入口">
        {[
          ['功能介绍', '看股镜可以帮你完成哪些研究动作。', '/official/features'],
          ['使用场景', '按真实问题进入：找股票、看持仓、追消息、建观察池。', '/official/scenarios'],
          ['后端能力', '了解行情、K 线、新闻和持仓模型如何协同工作。', '/official/backend'],
          ['投研流程', '从搜索股票、查看 K 线到检查持仓。', '/official/research'],
          ['联系我们', '反馈产品建议或了解开发进度。', '/official/contact'],
        ].map(([title, text, path]) => (
          <a href={path} key={path} data-site-card data-site-animate>
            <span>{title}</span>
            <p>{text}</p>
            <ChevronRight size={18} />
          </a>
        ))}
      </section>
    </>
  )
}

function ScenariosPage() {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>使用场景</span>
        <h1>股镜不是让用户先学复杂指标，而是从真实问题开始。</h1>
        <p>每个入口都对应一个常见场景：找不到股票代码、已有持仓需要判断、担心新闻波动、想长期跟踪几只股票。</p>
      </section>
      <section className="site-scenarios" aria-label="股镜使用场景">
        {scenarios.map((scenario, index) => (
          <article className="site-scenario-card" key={scenario.title} data-site-card data-site-animate>
            <div className="site-scenario-index">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <em>{scenario.tag}</em>
            </div>
            <h2>{scenario.title}</h2>
            <p>{scenario.text}</p>
            <ul>
              {scenario.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="site-trust site-scenario-summary" data-site-card data-site-animate>
        <div>
          <Sparkles size={24} />
          <h2>用户看到的是场景，后端处理的是数据链路。</h2>
          <p>前端尽量用简单语言解释“下一步该看什么”，后端负责补齐行情、K 线、新闻和持仓数据，让建议更有针对性。</p>
        </div>
        <aside>
          <ShieldCheck size={20} />
          <strong>研究辅助</strong>
          <p>场景建议用于帮助用户整理信息，不构成证券投资建议，也不承诺未来涨跌结果。</p>
        </aside>
      </section>
    </>
  )
}

function FeaturesPage() {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>功能介绍</span>
        <h1>把分散的行情、新闻和持仓信息整理成清楚的研究模块。</h1>
        <p>这里展开讲股镜的核心能力。用户可以按自己关心的部分进入说明，不需要在首页一次性看完所有内容。</p>
      </section>
      <section className="site-section">
        <div className="site-section-heading" data-site-card data-site-animate>
          <span>核心能力</span>
          <h2>先看重点，再按需展开。</h2>
          <p>每个模块都围绕一个投资前常见问题：找哪只股票、走势是否稳定、消息面会不会放大波动、当前持仓是否过度集中。</p>
        </div>
        <FeatureCards />
      </section>
      <section className="site-showcase" aria-label="股镜平台演示" data-site-card data-site-animate>
        <div className="site-showcase-copy">
          <span>功能预览</span>
          <h2>行情、K 线、持仓和新闻，放进同一套研究语言。</h2>
          <p>股镜不是把所有数据堆给用户，而是把实时价格、历史走势、新闻波动和组合风险拆成可以逐项检查的模块。</p>
          <a className="site-secondary-action" href="/official/backend">查看后端如何分析</a>
        </div>
        <div className="site-showcase-grid">
          <img src={searchScreen} alt="股镜搜索候选股票界面" />
          <div className="site-note-cloud">
            {dashboardNotes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
          <img src={portfolioScreen} alt="股镜持仓收益和组合风险界面" />
        </div>
      </section>
    </>
  )
}

function BackendPage() {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>后端能力</span>
        <h1>股镜的核心不只是界面，而是把股票数据整理成可解释的分析链路。</h1>
        <p>后端负责把 A 股目录、实时行情、历史 K 线、新闻波动和持仓数据串起来，最终在前端展示成用户能看懂的风险提示。</p>
      </section>

      <section className="site-backend-system" aria-label="股镜股票分析后端">
        <div className="site-section-heading" data-site-card data-site-animate>
          <span>分析后端</span>
          <h2>从数据接入到持仓建议，分成六层处理。</h2>
          <p>每一层都服务于一个明确目标：找得到股票、看得到行情、补得上走势、解释得清波动、算得出持仓风险。</p>
        </div>
        <div className="site-pipeline" aria-label="股镜后端分析管线">
          {backendPipeline.map(([title, text], index) => (
            <article className="site-pipeline-card" key={title} data-site-card data-site-animate>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="site-backend-grid">
          {backendLayers.map((layer, index) => (
            <article className="site-backend-card" key={layer.title} data-site-card data-site-animate>
              <div className="site-backend-card-head">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <em>{layer.status}</em>
              </div>
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
              <ul>
                {layer.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="site-backend-flow" data-site-card data-site-animate>
        <div>
          <span>一次分析如何生成</span>
          <h2>搜索一只股票后，后端会按顺序补齐这些信息。</h2>
        </div>
        <ol>
          <li>先从 A 股目录确认股票代码、企业名称和行业分类。</li>
          <li>再读取行情价格、涨跌幅、更新时间和市场概况。</li>
          <li>补充历史 K 线、开盘价、昨日收盘价和阶段高低点。</li>
          <li>结合新闻、公告和行业关键词，提取可能导致波动的原因。</li>
          <li>如果用户已加入持仓，再叠加本金、成本价、仓位和集中度。</li>
          <li>最后输出“是否建议重仓持有、未来走势倾向、主要风险点”。</li>
        </ol>
      </section>

      <section className="site-trust site-backend-risk" data-site-card data-site-animate>
        <div>
          <ShieldCheck size={24} />
          <h2>模型会解释依据，但不会替用户承诺收益。</h2>
          <p>股镜的后端建议更像“研究检查清单”：告诉用户哪里需要关注、为什么要谨慎、哪些条件变化后可以重新评估。</p>
        </div>
        <aside>
          <LockKeyhole size={20} />
          <strong>上线目标</strong>
          <p>继续提高行情源稳定性、每日补全任务、新闻波动模型和真机联网体验，让用户打开 App 时看到的是可用数据，而不是空状态。</p>
        </aside>
      </section>
    </>
  )
}

function ResearchPage({ activeStep, setActiveStep }) {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>投研流程</span>
        <h1>让新用户也能按步骤完成一次股票研究。</h1>
        <p>流程页把主要步骤拆开：先找到股票，再看走势和消息，最后回到持仓和本金风险。</p>
      </section>
      <WorkflowSection activeStep={activeStep} setActiveStep={setActiveStep} />
      <section className="site-audience" aria-label="适用用户">
        <div className="site-section-heading" data-site-card data-site-animate>
          <span>适用用户</span>
          <h2>适合不同阶段的投资研究习惯。</h2>
        </div>
        <div className="site-audience-grid">
          {audience.map(([title, text]) => (
            <article key={title} data-site-card data-site-animate>
              <Layers3 size={22} />
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="/official/features">查看功能</a>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function ContactPage() {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>联系我们</span>
        <h1>欢迎反馈产品建议，尤其是数据稳定性、新闻模型和持仓建议。</h1>
        <p>股镜仍在持续打磨中。如果你愿意提前体验或提出建议，可以通过邮箱联系开发者。</p>
      </section>
      <section className="site-contact" data-site-card data-site-animate>
        <div>
          <span>产品反馈</span>
          <h2>把你最想要的股票研究功能告诉我们。</h2>
          <p>我们会优先完善行情稳定性、新闻波动模型、持仓建议框架和 iPhone 真机体验。</p>
        </div>
        <a className="site-primary-action" href="mailto:gujingapp@163.com">
          <Mail size={18} />
          gujingapp@163.com
        </a>
      </section>
      <section className="site-testimonials" aria-label="示例用户反馈">
        {[
          '把分散的新闻和价格变化整理成同一套研究流程。',
          '观察池提醒让我更容易知道哪些股票需要重新检查。',
          '持仓集中度提示比单看涨跌幅更有帮助。',
        ].map((quote) => (
          <blockquote key={quote} data-site-card data-site-animate>
            <p>“{quote}”</p>
            <cite>示例反馈</cite>
          </blockquote>
        ))}
      </section>
    </>
  )
}

function PrivacyPage() {
  return (
    <>
      <section className="site-subpage-hero" data-site-card data-site-animate>
        <span>隐私说明</span>
        <h1>解释股镜会保存哪些数据，以及这些数据为什么需要保存。</h1>
        <p>这一页用于给用户快速理解隐私边界；完整版本仍保留在正式隐私政策网页里，方便审核和用户查看。</p>
      </section>
      <section className="site-trust site-privacy-panel" data-site-card data-site-animate>
        <div>
          <LockKeyhole size={24} />
          <h2>账户、观察池、持仓和提醒规则只用于产品功能。</h2>
          <p>股镜会保存必要的账户标识、观察池、持仓、提醒和使用偏好，用于同步数据、生成个性化风险提示和恢复用户设置。</p>
          <div className="site-privacy-list">
            <span>不出售个人信息</span>
            <span>不承诺收益</span>
            <span>可查看正式政策</span>
          </div>
        </div>
        <aside>
          <ShieldCheck size={20} />
          <strong>正式隐私政策</strong>
          <p>如果需要完整条款、数据用途、联系方式和删除数据说明，请查看正式网页。</p>
          <a className="site-secondary-action" href="/privacy.html">查看隐私政策</a>
        </aside>
      </section>
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer" data-site-card data-site-animate>
      <div>
        <strong>股镜 Gujing</strong>
        <p>本网站仅用于产品介绍和研究辅助说明，不提供证券投资建议、收益承诺或买卖指令。</p>
      </div>
      <div>
        <a href="/terms.html">用户协议</a>
        <a href="/privacy.html">隐私政策</a>
        <a href="mailto:gujingapp@163.com">联系开发者</a>
      </div>
      <TrendingUp size={20} aria-hidden="true" />
    </footer>
  )
}

function OfficialSite() {
  const siteRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const pageKey = getPageKey()

  useGSAP(() => {
    const root = siteRef.current
    if (!root) return undefined

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(root.querySelectorAll('[data-site-animate]'), { autoAlpha: 1, y: 0, scale: 1 })
      return undefined
    })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = root.querySelectorAll('[data-site-intro]')
      const cards = root.querySelectorAll('[data-site-card]')
      const floats = root.querySelectorAll('[data-site-float]')
      const tape = root.querySelector('[data-site-tape]')
      const boardRows = root.querySelectorAll('[data-site-board-row]')
      const scanLine = root.querySelector('[data-site-scanline]')

      gsap.fromTo(
        intro,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.68, ease: 'power3.out', stagger: 0.07 },
      )

      gsap.utils.toArray(cards).forEach((card) => {
        gsap.fromTo(
          card,
          { y: 28 },
          {
            y: 0,
            duration: 0.62,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              once: true,
            },
          },
        )
      })

      gsap.to(floats, {
        y: (index) => (index % 2 === 0 ? -10 : 10),
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.16,
      })

      if (tape) {
        gsap.to(tape, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 })
      }

      gsap.to(boardRows, {
        x: (index) => (index % 2 === 0 ? -12 : 12),
        duration: 5.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.12,
      })

      if (scanLine) {
        gsap.fromTo(
          scanLine,
          { xPercent: -120 },
          { xPercent: 120, duration: 3.8, ease: 'none', repeat: -1, repeatDelay: 0.8 },
        )
      }

      return undefined
    })

    return () => mm.revert()
  }, { scope: siteRef })

  useGSAP(() => {
    const root = siteRef.current
    if (!root) return
    const panel = root.querySelector('.site-workflow-panel')
    if (!panel) return
    gsap.fromTo(panel, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power2.out' })
  }, { dependencies: [activeStep], scope: siteRef })

  return (
    <main className="official-site" ref={siteRef}>
      <SiteNav pageKey={pageKey} />
      {pageKey === 'home' && <HomePage />}
      {pageKey === 'features' && <FeaturesPage />}
      {pageKey === 'scenarios' && <ScenariosPage />}
      {pageKey === 'backend' && <BackendPage />}
      {pageKey === 'research' && <ResearchPage activeStep={activeStep} setActiveStep={setActiveStep} />}
      {pageKey === 'contact' && <ContactPage />}
      {pageKey === 'privacy' && <PrivacyPage />}
      <Footer />
    </main>
  )
}

export default OfficialSite
