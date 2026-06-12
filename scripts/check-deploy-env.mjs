const target = process.argv[2] || process.env.GUJING_API_URL || 'https://gujing-api.onrender.com'
const shouldRunBackfill = process.argv.includes('--run-backfill')
const baseUrl = target.replace(/\/$/, '')

async function readJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }
  return { ok: response.ok, status: response.status, payload }
}

function mark(ok) {
  return ok ? 'OK' : '需要处理'
}

async function main() {
  console.log(`股镜部署环境核验：${baseUrl}`)

  const health = await readJson('/api/health')
  console.log(`健康检查：${mark(health.ok)} (${health.status})`)

  const readiness = await readJson('/api/system/readiness')
  const checks = readiness.payload?.checks || {}
  const hasLatestReadiness = Boolean(readiness.payload?.launch)
  console.log(`后端版本：${mark(hasLatestReadiness)}${hasLatestReadiness ? '' : '，线上还没有最新 launch/readiness 字段'}`)
  console.log(`DATABASE_URL：${mark(checks.database?.mode === 'postgres')}，当前 ${checks.database?.mode || 'unknown'}`)
  console.log(`TUSHARE_TOKEN：${mark(Boolean(checks.tushare?.configured || checks.tushare?.ok))}`)
  console.log(`数据状态：${checks.data?.mode || 'unknown'}，${checks.data?.message || '暂无消息'}`)
  console.log(`A股目录：${mark(Boolean(checks.stockDirectory?.ok))}，${checks.stockDirectory?.count ?? 0}/${checks.stockDirectory?.minimum ?? 4500} 只`)
  console.log(`每日补全：${mark(Boolean(checks.dailyBackfill?.ok))}，最近 ${checks.dailyBackfill?.syncedCount ?? 0} 只`)
  console.log(`部署地址：${checks.deployment?.serviceUrl || '未检测到'}`)

  const dataStatus = await readJson('/api/data/status')
  const dailyBackfill = dataStatus.payload?.dailyBackfill
  console.log(`免费源任务状态：${dataStatus.ok ? '可读取' : `失败 ${dataStatus.status}`}`)
  console.log(`股票目录：${dataStatus.payload?.stockDirectory?.count ?? checks.database?.stockCount ?? 0} 只`)
  console.log(`每日补全状态：${dailyBackfill?.lastRefresh ? `${dailyBackfill.syncedCount || 0} 只，${dailyBackfill.lastRefresh}` : '未检测到'}`)

  const tasks = await readJson('/api/tasks/status')
  const taskIds = (tasks.payload?.tasks || []).map((task) => task.taskId)
  console.log(`后台任务：${taskIds.length} 项${taskIds.includes('daily_data_backfill') ? '，含每日补全' : '，缺每日补全'}`)

  const backfillProbe = await readJson('/api/data/backfill/daily', {
    method: 'POST',
    body: JSON.stringify({ limit: 1, force: false }),
  })
  if (backfillProbe.status === 404) {
    console.log('每日补全接口：需要处理，线上代码未更新')
  } else if (!shouldRunBackfill) {
    console.log(`每日补全接口：${mark(backfillProbe.ok)} (${backfillProbe.status})`)
  } else {
    console.log(`每日补全实测：${mark(backfillProbe.ok)} (${backfillProbe.status})`)
    if (backfillProbe.payload?.message) console.log(`补全结果：${backfillProbe.payload.message}`)
  }

  const blockers = []
  if (!hasLatestReadiness) blockers.push('重新部署 Render 最新 main 分支')
  if (checks.database?.mode !== 'postgres') blockers.push('在 Render 配置 DATABASE_URL / PostgreSQL')
  if (!(checks.tushare?.configured || checks.tushare?.ok)) blockers.push('在 Render 配置 TUSHARE_TOKEN')
  if (checks.stockDirectory && !checks.stockDirectory.ok) blockers.push('执行全量 A 股目录同步，确认股票目录数量达到上线阈值')
  if (checks.dailyBackfill && !checks.dailyBackfill.ok) blockers.push('确认每日数据补全任务已在线上注册并运行')
  if (!taskIds.includes('daily_data_backfill')) blockers.push('确认线上代码包含 daily_data_backfill 后台任务')

  if (blockers.length) {
    console.log('\n需要处理：')
    for (const item of blockers) console.log(`- ${item}`)
    process.exitCode = 1
    return
  }

  console.log('\n线上环境和本地关键能力已对齐。')
}

main().catch((error) => {
  console.error(`部署核验失败：${error.message}`)
  process.exit(1)
})
