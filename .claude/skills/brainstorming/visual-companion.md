# 视觉伴侣指南

基于浏览器的视觉头脑风暴伴侣，用于展示线框图、图表和选项。

## 何时使用

按问题决策，不是按会话。判断标准：**用户通过看到它比阅读它能更好地理解吗？**

**使用浏览器** 当内容本身就是视觉的：

- **UI 线框图** — 布局、导航结构、组件设计
- **架构图表** — 系统组件、数据流、关系图
- **并行视觉比较** — 比较两种布局、两种配色方案、两种设计方向
- **设计打磨** — 当问题是关于外观和感觉、间距、视觉层次
- **空间关系** — 状态机、流程图、实体关系渲染为图表

**使用终端** 当内容是文本或表格的：

- **需求和范围问题** — "X 是什么意思？"、"哪些功能在范围内？"
- **概念性 A/B/C 选择** — 用文字描述的方案之间进行选择
- **权衡列表** — 优缺点、比较表
- **技术决策** — API 设计、数据建模、架构方法选择
- **澄清问题** — 答案不是视觉偏好而是文字的任何问题

关于 UI 主题的问题*不一定*自动是视觉问题。"你想要什么样的向导？"是概念性的——使用终端。"这些向导布局中哪个感觉是对的？"是视觉的——使用浏览器。

## 工作原理

服务器监视目录中的 HTML 文件并将最新的提供给浏览器。你将 HTML 内容写入 `screen_dir`，用户在浏览器中看到它并可以点击选择选项。选择被记录到 `state_dir/events`，你在下一轮读取。

**内容片段 vs 完整文档：** 如果你的 HTML 文件以 `<!DOCTYPE` 或 `<html>` 开头，服务器按原样提供服务（只需注入辅助脚本）。否则，服务器会自动将你的内容包装在框架模板中——添加标题、CSS 主题、选择指示器和所有交互基础设施。**默认编写内容片段。** 只有当你需要完全控制页面时才编写完整文档。

## 启动会话

```bash
# 启动服务器并持久化（线框图保存到项目）
scripts/start-server.sh --project-dir /path/to/project

# 返回: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/path/to/project/.harness/brainstorm/12345-1706000000/content",
#           "state_dir":"/path/to/project/.harness/brainstorm/12345-1706000000/state"
```

保存响应中的 `screen_dir` 和 `state_dir`。告诉用户打开该 URL。

**查找连接信息：** 服务器将其启动 JSON 写入 `$STATE_DIR/server-info`。如果你在后台启动了服务器但没有捕获 stdout，读取该文件以获取 URL 和端口。使用 `--project-dir` 时，在 `<project>/.harness/brainstorm/` 中查找会话目录。

**注意：** 传递项目根目录作为 `--project-dir`，以便线框图持久保存在 `.harness/brainstorm/` 中并在服务器重启后保留。没有它，文件会进入 `/tmp` 并被清理。如果 `.harness/` 尚未在 `.gitignore` 中，提醒用户添加。

**按平台启动服务器：**

**Claude Code (macOS / Linux):**
```bash
# 默认模式可用——脚本让服务器在后台运行
scripts/start-server.sh --project-dir /path/to/project
```

**Claude Code (Windows):**
```bash
# Windows 自动检测并使用前台模式，这会阻塞工具调用。
# 使用 Bash 工具上的 run_in_background: true，以便服务器在
# 对话轮次之间保持运行。
scripts/start-server.sh --project-dir /path/to/project
```
通过 Bash 工具调用时，设置 `run_in_background: true`。然后在下一轮读取 `$STATE_DIR/server-info` 以获取 URL 和端口。

**Codex:**
```bash
# Codex 会回收后台进程。脚本自动检测 CODEX_CI 并
# 切换到前台模式。正常运行即可——无需额外标志。
scripts/start-server.sh --project-dir /path/to/project
```

**Gemini CLI:**
```bash
# 使用 --foreground 并在你的 shell 工具上设置 is_background: true
# 以便进程在轮次之间保持运行
scripts/start-server.sh --project-dir /path/to/project --foreground
```

**其他环境：** 服务器必须在对话轮次之间保持后台运行。如果你的环境回收分离的进程，使用 `--foreground` 并使用你的平台的后台执行机制启动命令。

如果浏览器无法访问 URL（常见于远程/容器化设置），绑定一个非环回主机：

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

使用 `--url-host` 控制返回的 URL JSON 中的主机名。

## 循环流程

1. **检查服务器是否存活**，然后**将 HTML 写入** `screen_dir` 中的新文件：
   - 每次写入前，检查 `$STATE_DIR/server-info` 是否存在。如果不存在（或 `$STATE_DIR/server-stopped` 存在），服务器已关闭——继续之前用 `start-server.sh` 重启它。服务器在 30 分钟不活动后自动退出。
   - 使用语义文件名：`platform.html`、`visual-style.html`、`layout.html`
   - **永远不要重用文件名** — 每个屏幕都获取一个新文件
   - 使用 Write 工具 — **永远不要使用 cat/heredoc**（会在终端产生噪音）
   - 服务器自动服务最新的文件

2. **告诉用户预期什么并结束你的轮次：**
   - 提醒他们 URL（每步都要，不只是第一步）
   - 给出屏幕上内容的简要文本摘要（例如，"显示主页的3种布局选项"）
   - 请他们在终端回复："看一下告诉我你的想法。如果想选择选项请点击。"

3. **在你的下一轮** — 用户在终端回复后：
   - 读取 `$STATE_DIR/events`（如果存在）— 这包含用户的浏览器交互（点击、选择）为 JSON 行
   - 与用户的终端文本合并以获得完整图景
   - 终端消息是主要反馈；`state_dir/events` 提供结构化的交互数据

4. **迭代或前进** — 如果反馈改变了当前屏幕，写一个新文件（例如 `layout-v2.html`）。只有当前步骤验证后才进入下一步。

5. **返回终端时卸载** — 当下一步不需要浏览器时（例如，澄清问题、权衡讨论），推送一个等待屏幕以清除过时内容：

   ```html
   <!-- 文件名: waiting.html (或 waiting-2.html 等) -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">在终端继续中...</p>
   </div>
   ```

   这防止用户在对话已进行到下一步时盯着已解决的选择。当下一个视觉问题出现时，像往常一样推送新的内容文件。

6. 重复直到完成。

## 编写内容片段

只写放在页面内部的内容。服务器会自动将其包装在框架模板中（标题、主题 CSS、选择指示器和所有交互基础设施）。

**最小示例：**

```html
<h2>哪种布局效果更好？</h2>
<p class="subtitle">考虑可读性和视觉层次</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>单列</h3>
      <p>干净、专注的阅读体验</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>双列</h3>
      <p>侧边栏导航配合主内容</p>
    </div>
  </div>
</div>
```

就这样。不需要 `<html>`、CSS 或 `<script>` 标签。服务器提供所有这些。

## 可用的 CSS 类

框架模板为你的内容提供这些 CSS 类：

### 选项（A/B/C 选择）

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>标题</h3>
      <p>描述</p>
    </div>
  </div>
</div>
```

**多选：** 在容器上添加 `data-multiselect` 以允许用户选择多个选项。每次点击切换项目。指示器栏显示计数。

```html
<div class="options" data-multiselect>
  <!-- 相同的选项标记 — 用户可以选中/取消选中多个 -->
</div>
```

### 卡片（视觉设计）

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- 线框图内容 --></div>
    <div class="card-body">
      <h3>名称</h3>
      <p>描述</p>
    </div>
  </div>
</div>
```

### 线框图容器

```html
<div class="mockup">
  <div class="mockup-header">预览：仪表盘布局</div>
  <div class="mockup-body"><!-- 你的线框图 HTML --></div>
</div>
```

### 分屏视图（并行）

```html
<div class="split">
  <div class="mockup"><!-- 左侧 --></div>
  <div class="mockup"><!-- 右侧 --></div>
</div>
```

### 优缺点

```html
<div class="pros-cons">
  <div class="pros"><h4>优点</h4><ul><li>好处</li></ul></div>
  <div class="cons"><h4>缺点</h4><ul><li>缺点</li></ul></div>
</div>
```

### 线框元素（线框构建块）

```html
<div class="mock-nav">Logo | 首页 | 关于 | 联系</div>
<div style="display: flex;">
  <div class="mock-sidebar">导航</div>
  <div class="mock-content">主要内容区域</div>
</div>
<button class="mock-button">操作按钮</button>
<input class="mock-input" placeholder="输入框">
<div class="placeholder">占位区域</div>
```

### 排版和章节

- `h2` — 页面标题
- `h3` — 章节标题
- `.subtitle` — 标题下方的副文本
- `.section` — 带底部边距的内容块
- `.label` — 小号大写标签文本

## 浏览器事件格式

当用户点击浏览器中的选项时，他们的交互被记录到 `$STATE_DIR/events`（每行一个 JSON 对象）。当推送新屏幕时文件自动清除。

```jsonl
{"type":"click","choice":"a","text":"选项 A - 简单布局","timestamp":1706000101}
{"type":"click","choice":"c","text":"选项 C - 复杂网格","timestamp":1706000108}
{"type":"click","choice":"b","text":"选项 B - 混合","timestamp":1706000115}
```

完整的事件流显示用户的探索路径——他们可能会在确定之前点击多个选项。最后一个 `choice` 事件通常是最终选择，但点击模式可以揭示犹豫或值得询问的偏好。

如果 `$STATE_DIR/events` 不存在，用户没有与浏览器交互——只使用他们的终端文本。

## 设计提示

- **根据问题调整保真度** — 布局用线框图，打磨问题用精修
- **在每个页面上解释问题** — "哪种布局感觉更专业？" 而不只是"选一个"
- **在前进前迭代** — 如果反馈改变了当前屏幕，写一个新版本
- **每屏最多 2-4 个选项**
- **当内容重要时使用真实内容** — 对于摄影作品集，使用实际图片（Unsplash）。占位内容会掩盖设计问题。
- **保持线框图简单** — 专注于布局和结构，而不是像素完美的设计

## 文件命名

- 使用语义名称：`platform.html`、`visual-style.html`、`layout.html`
- 永远不要重用文件名 — 每个屏幕必须是新文件
- 对于迭代：附加版本后缀如 `layout-v2.html`、`layout-v3.html`
- 服务器按修改时间服务最新文件

## 清理

```bash
scripts/stop-server.sh $SESSION_DIR
```

如果会话使用了 `--project-dir`，线框图文件会持久保存在 `.harness/brainstorm/` 中供以后参考。只有 `/tmp` 会话在停止时被删除。

## 参考

- 框架模板（CSS 参考）：`scripts/frame-template.html`
- 辅助脚本（客户端）：`scripts/helper.js`
