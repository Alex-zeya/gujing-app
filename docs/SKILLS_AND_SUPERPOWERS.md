# Codex Skills And Superpowers

这份文档记录股镜项目当前可借助的 Codex skill，以及刚安装的 Superpowers 插件怎么使用。它主要给后续继续开发、测试、上线检查和协作审查使用。

## 当前策略

股镜现在不需要把所有 skill 都塞进日常流程。建议按任务选择：

- 产品和 UI 打磨：优先用 `impeccable`、`frontend-ui-engineering`、`webapp-testing`。
- 后端、数据源、接口稳定性：优先用 `api-and-interface-design`、`debugging-and-error-recovery`、`observability-and-instrumentation`。
- 上线前检查：优先用 `shipping-and-launch`、`security-and-hardening`、`code-review-and-quality`。
- 复杂任务拆解、严格测试和收尾验证：使用 Superpowers 里的流程型 skill。

## Superpowers 插件

插件位置：

```text
/Users/alex-w/.codex/plugins/cache/openai-curated-remote/superpowers/5.1.3
```

已安装的 Superpowers skill：

| Skill | 适合什么时候用 |
| --- | --- |
| `using-superpowers` | 判断当前任务应该调用哪个 Superpowers skill。 |
| `brainstorming` | 做新功能、改体验、改产品逻辑前先梳理目标。 |
| `writing-plans` | 多步骤任务开始前写实施计划。 |
| `executing-plans` | 按已经写好的计划执行。 |
| `test-driven-development` | 改登录、行情、持仓计算、搜索等关键逻辑时先写测试。 |
| `systematic-debugging` | 遇到线上报错、接口失败、数据不同步时按步骤定位。 |
| `verification-before-completion` | 说“完成了”之前跑验证命令。 |
| `requesting-code-review` | 大改动完成后做代码审查。 |
| `receiving-code-review` | 收到审查意见后逐条判断和修改。 |
| `using-git-worktrees` | 大功能需要隔离分支或并行开发时使用。 |
| `dispatching-parallel-agents` | 多个互不影响的任务并行检查时使用。 |
| `subagent-driven-development` | 大任务拆给多个子任务执行时使用。 |
| `finishing-a-development-branch` | 分支开发完成后决定合并、提交和收尾。 |
| `writing-skills` | 以后自己写或改 skill 时使用。 |

## 怎么在对话里调用

直接在需求里写出 skill 或 Superpowers 即可，例如：

```text
用 superpowers 帮我检查登录和股票搜索有没有上线风险
```

```text
用 systematic-debugging 看一下为什么 K 线有些股票出不来
```

```text
用 verification-before-completion 跑一遍前后端测试，再告诉我能不能上线
```

```text
用 brainstorming 帮我设计一个更适合小白用户的持仓建议流程
```

Codex 会根据当前任务读取对应的 `SKILL.md`，再按里面的流程执行。

## 本次清理记录

本次只清理明确重复或备份性质的目录，没有删除正式 skill：

- 删除：`/Users/alex-w/.codex/skills/impeccable.backup-20260621-083604`
- 删除：`/Users/alex-w/.codex/skills/impeccable.plugin-backup-20260621-083622`
- 删除：`/Users/alex-w/.codex/skills/taste-skill`
- 保留：`/Users/alex-w/.codex/skills/impeccable`
- 保留：`/Users/alex-w/.codex/skills/taste-skill-latest`

`taste-skill` 和 `taste-skill-latest` 内容一致，因此只保留新版目录。两个 `impeccable` 备份目录按名称判断是历史备份，保留当前正式版本。

其余 skill 虽然不是每天都会用，但分别覆盖测试、上线、接口、安全、文档、性能、产品验证等场景，后续股镜继续上线和维护时仍然有用，因此暂时保留。
