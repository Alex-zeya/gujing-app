import { expect, test } from '@playwright/test'

async function login(page) {
  await page.goto('/?e2e=app')
  await expect(page.getByText('登录后查看你的持仓和观察池')).toBeVisible()

  await page.getByLabel('手机号').fill('15995270070')
  await page.getByPlaceholder('6 位验证码').fill('123456')
  await page.getByRole('button', { name: '手机号登录' }).click()
  await expect(page.getByText('市场监看')).toBeVisible()
}

test.describe('股镜核心用户流程', () => {
  test('登录后可以搜索、分析、加入持仓并打开说明页', async ({ page }) => {
    const consoleErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await login(page)

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
    await expect(page.getByText('运行监控')).toBeVisible()
    await expect(page.getByText('安全和说明')).toBeVisible()
    const privacyPagePromise = page.context().waitForEvent('page')
    await page.getByRole('link', { name: '隐私政策网页' }).click()
    const privacyPage = await privacyPagePromise
    await expect(privacyPage.getByRole('heading', { name: '隐私政策' })).toBeVisible()

    expect(consoleErrors).toEqual([])
  })
})
