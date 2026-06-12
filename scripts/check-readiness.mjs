const target = process.argv[2] || process.env.GUJING_API_URL || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010'
const baseUrl = target.replace(/\/$/, '')

async function main() {
  const response = await fetch(`${baseUrl}/api/system/readiness`)
  if (!response.ok) {
    throw new Error(`readiness failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const launch = payload.launch || {}
  const checks = payload.checks || {}
  const blocked = launch.blocked || []
  const hasLaunchPayload = Boolean(payload.launch)

  console.log(`股镜上线准备度：${launch.percent ?? 0}%`)
  console.log(`状态：${launch.status || payload.status || 'unknown'}`)
  console.log(`接口：${baseUrl}`)
  console.log(`数据库：${checks.database?.mode || 'unknown'}，股票目录 ${checks.database?.stockCount ?? 0} 只`)
  if (checks.stockDirectory) {
    console.log(`A股目录：${checks.stockDirectory.count ?? 0}/${checks.stockDirectory.minimum ?? 4500} 只，${checks.stockDirectory.message || '暂无状态'}`)
  }
  console.log(`行情：${checks.data?.mode || 'unknown'}，${checks.data?.message || '暂无状态'}`)
  if (checks.dailyBackfill) {
    console.log(`每日补全：${checks.dailyBackfill.configured ? '已注册' : '未注册'}，最近 ${checks.dailyBackfill.syncedCount ?? 0} 只`)
  }
  console.log(`登录：${checks.sms?.provider || 'unknown'} / ${checks.sms?.name || '未配置'}`)
  console.log(`生产地址：${checks.deployment?.serviceUrl || '未检测到 Render HTTPS 地址'}`)
  console.log('')

  if (!hasLaunchPayload) {
    console.log('上线前阻塞项：')
    console.log('- 后端版本：线上接口还没有 launch 上线准备度字段，请先部署最新代码。')
    if (checks.database?.mode !== 'postgres') {
      console.log('- 生产数据库：线上仍不是 PostgreSQL，请确认 Render DATABASE_URL 已生效。')
    }
    return
  }

  if (blocked.length === 0) {
    console.log('上线必备项已通过，可以进入 TestFlight/审核材料准备。')
    return
  }

  console.log('上线前阻塞项：')
  for (const gate of blocked) {
    console.log(`- ${gate.label}：${gate.next}`)
  }
}

main().catch((error) => {
  console.error(`上线检查失败：${error.message}`)
  process.exit(1)
})
