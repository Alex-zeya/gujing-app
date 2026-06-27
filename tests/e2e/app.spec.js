import { expect, test } from '@playwright/test'

async function login(page) {
  await page.goto('/?e2e=app', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('登录后同步你的持仓和观察池')).toBeVisible()

  await page.getByLabel('手机号').fill('15995270070')
  await page.getByPlaceholder('6 位验证码').fill('123456')
  await page.getByRole('button', { name: '手机号登录' }).click()
  await expect(page.getByText('市场监看')).toBeVisible()
}

test.describe('股镜核心用户流程', () => {
  test('官网入口展示产品定位、隐私入口和风险提示', async ({ page }) => {
    await page.goto('/official?e2e=site', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: '股镜' })).toBeVisible()
    await expect(page.getByText('把股票信息整理成可检查的风险框架')).toBeVisible()
    await expect(page.getByRole('link', { name: '功能介绍', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '使用场景', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '后端能力', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '投研流程', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '联系我们', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '查看隐私政策' })).toBeVisible()
    await expect(page.getByText('不构成证券投资建议')).toBeVisible()
    await expect(page.getByText('产品亮点')).toBeVisible()
    await expect(page.getByText('把股票研究从“看一堆数据”变成“按问题检查”。')).toBeVisible()
    await expect(page.getByText('从一个具体问题开始，不用先学复杂指标。')).toBeVisible()
    await expect(page.getByText('股镜的重点不是只做漂亮界面，而是把数据整理成可解释的建议。')).toBeVisible()

    await page.getByRole('link', { name: '功能介绍', exact: true }).click()
    await expect(page).toHaveURL(/\/official\/features/)
    await page.getByRole('button', { name: '展开股票搜索说明' }).click()
    await expect(page.getByText('支持企业名称、简称、代码关键词')).toBeVisible()
    await page.getByRole('button', { name: '展开持仓分析说明' }).click()
    await expect(page.getByText('把本金、持仓金额、成本价和盈亏放在一起')).toBeVisible()

    await page.getByRole('link', { name: '使用场景', exact: true }).click()
    await expect(page).toHaveURL(/\/official\/scenarios/)
    await expect(page.getByText('新手不知道股票代码')).toBeVisible()
    await expect(page.getByText('已有持仓想看风险')).toBeVisible()

    await page.getByRole('link', { name: '后端能力', exact: true }).click()
    await expect(page).toHaveURL(/\/official\/backend/)
    await expect(page.getByText('数据接入层')).toBeVisible()
    await expect(page.getByText('分析计算层')).toBeVisible()
    await expect(page.getByText('A 股名称与代码目录')).toBeVisible()
    await expect(page.getByText('实时行情与缓存')).toBeVisible()
    await expect(page.getByText('搜索一只股票后，后端会按顺序补齐这些信息')).toBeVisible()

    await page.getByRole('link', { name: '投研流程', exact: true }).click()
    await expect(page).toHaveURL(/\/official\/research/)
    await page.getByRole('button', { name: '查看先找股票完整步骤' }).click()
    await expect(page.getByText('输入股票代码、企业名称或行业关键词')).toBeVisible()

    await page.getByRole('link', { name: '隐私说明', exact: true }).click()
    await expect(page).toHaveURL(/\/official\/privacy/)
    await expect(page.getByText('账户、观察池、持仓和提醒规则只用于产品功能')).toBeVisible()
  })

  test('登录后可以搜索、分析、加入持仓并打开说明页', async ({ page }) => {
    const consoleErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await login(page)
    await expect(page.getByRole('heading', { name: '波动雷达' })).toBeVisible()

    await page.getByRole('button', { name: '找股票' }).click()
    await expect(page.getByText('查一只股票')).toBeVisible()
    await page.getByPlaceholder('输入代码、企业名称或简称').fill('电气')
    await expect(page.getByText('相关股票')).toBeVisible()
    await page.locator('.suggestion-panel button').first().click()
    await expect(page.getByText('一键加入持仓')).toBeVisible()

    await page.getByRole('button', { name: '一键加入持仓' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('持仓金额').fill('10000')
    await page.getByLabel('成本价').fill('10')
    await page.getByRole('button', { name: '确认加入持仓' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.getByRole('button', { name: '持仓', exact: true }).click()
    await expect(page.getByText('本金收益')).toBeVisible()
    await expect(page.getByText('组合风险评分', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '观察', exact: true }).click()
    await expect(page.getByRole('heading', { name: '观察池' })).toBeVisible()

    await page.getByRole('button', { name: '我的', exact: true }).click()
    await expect(page.getByText('数据与连接')).toBeVisible()
    await expect(page.getByText('行情连接')).toBeVisible()
    await expect(page.getByText('安全和说明')).toBeVisible()
    await expect(page.getByText('研究辅助，不构成投资建议')).toBeVisible()
    await page.getByRole('button', { name: 'Alex-w有话说' }).click()
    await expect(page.getByText('感谢 Wendy 同学')).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
    await expect(page.getByText('运行监控')).toHaveCount(0)
    const privacyPagePromise = page.context().waitForEvent('page')
    await page.getByRole('link', { name: '隐私政策网页' }).click()
    const privacyPage = await privacyPagePromise
    await expect(privacyPage.getByRole('heading', { name: '隐私政策' })).toBeVisible()

    expect(consoleErrors).toEqual([])
  })
})
