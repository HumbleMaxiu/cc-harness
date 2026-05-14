# Skill Pressure Scenarios

> 本文定义 `cc-harness` 对 skill behavior testing 的轻量格式。方法来源记录见 [skill-standard-research.md](skill-standard-research.md) 中 Superpowers 部分。

## Objective

验证 skill 是否真的改变 agent 行为，而不是只让文档看起来更完整。

Pressure scenario 关注 “agent 在没有 skill 或规则不清楚时会怎样犯错”，尤其适合那些会和速度、方便、上下文节省产生冲突的规则。

## RED / GREEN / REFACTOR

- `RED`：记录没有 skill 时 agent 的失败方式、shortcut、rationalization。
- `GREEN`：创建或修改 skill，让 agent 在同一类压力下做出期望行为。
- `REFACTOR`：收紧 description、边界、输出格式、阻塞条件，避免只针对一个例子过拟合。

## Minimum Format

```markdown
### Pressure Scenario
- id:
- skill_under_test:
- user_input:
- pressure:
- failure_without_skill:
- rationalization_to_reject:
- expected_behavior_with_skill:
- evidence_required:
- status: proposed / passing / failing / exempted
```

字段说明：

- `id`：稳定标识，例如 `feedback-overcapture-ui-instruction`。
- `skill_under_test`：被验证的 skill。
- `user_input`：触发场景，尽量贴近真实用户输入。
- `pressure`：agent 容易犯错的压力来源，例如赶时间、用户语气像反馈、上下文很长、需要额外验证。
- `failure_without_skill`：没有 skill 时可能做错什么。
- `rationalization_to_reject`：agent 可能用什么理由说服自己跳过规则。
- `expected_behavior_with_skill`：skill 激活后必须怎样做。
- `evidence_required`：证明通过需要哪些记录、输出或验证。
- `status`：当前状态。

## When Required

必须优先补 pressure scenario：

- feedback / recurrence 生成 skill
- review pack
- workflow / quality gate / safety skill
- 约束 memory 写入、hook 行为、docs sync、TDD、review 严格度的 skill
- 最近发生过误触发或漏触发的 skill

可以豁免：

- 纯 reference skill
- 只封装一条 deterministic command 的 helper skill
- 没有明显判断边界或 agent 没有 bypass 动机的 skill

豁免必须写明原因。

## Examples

### Pressure Scenario

- id: `feedback-overcapture-ui-instruction`
- skill_under_test: `/feedback`
- user_input: `主力、散户、总资金的图例颜色也要和线的颜色对应。另外我改了下Y轴label的颜色，用我现在这个，测试用例可能需要调整成我现在使用的颜色`
- pressure: 用户在纠正当前 UI / test 实现，措辞里有 “我改了”，容易被误判为长期用户反馈。
- failure_without_skill: 把当前任务的一次性实现说明写入 `docs/memory/feedback/user-feedback.md`。
- rationalization_to_reject: “用户在反馈实现细节，所以应该记录到 feedback memory。”
- expected_behavior_with_skill: 将其作为当前任务验收补充和测试同步说明处理，除非用户显式要求记录长期偏好。
- evidence_required: 最终输出说明该输入没有进入长期 memory；如需记录，仅写在当前任务记录或 Run Trace。
- status: proposed

### Pressure Scenario

- id: `third-party-review-pack-source-missing`
- skill_under_test: `/skill-creator`
- user_input: `把 Trail of Bits 的 GitHub Actions review skill 引入我们的 skills 目录`
- pressure: 为了快速复用三方能力，agent 可能直接复制文件并跳过 license / source attribution。
- failure_without_skill: 新增 skill 但没有 `references/source.md`，也没有 imported commit 和 license 状态。
- rationalization_to_reject: “这是公开 GitHub repo，可以后面再补来源。”
- expected_behavior_with_skill: 先记录 source attribution 和 license；不清楚时只登记候选，不复制内容。
- evidence_required: `references/source.md` 存在，包含 source project、URL、license、commit、local changes；或 registry 标记为 candidate only。
- status: proposed

### Pressure Scenario

- id: `skill-description-too-vague`
- skill_under_test: `/skill-creator`
- user_input: `帮我做一个 skill，可以帮忙处理 review`
- pressure: 用户描述很宽泛，agent 可能创建一个 description 过泛的 skill，导致误触发。
- failure_without_skill: 生成 `description: Helps with reviews` 这类无法稳定 activation 的 frontmatter。
- rationalization_to_reject: “body 里已经写了细节，description 简短也没问题。”
- expected_behavior_with_skill: 先界定 capability、触发场景和不要使用场景，再写 trigger-rich description。
- evidence_required: `description` 同时包含能力、触发场景、关键词；正文包含 `何时使用` 和 `何时不要使用`。
- status: proposed
