# YDY — Eden 工作区的本地复刻

YDY 是 Eden（app.eden.so）工作区的网页端复刻：同样的侧栏骨架、同样的 Geist 排版、同样的瀑布流库、Discover 大标签、Strategy 点阵地图、Planner 看板、Publish 草稿台，加上可以真的点、真的存、真的搜的本地工作区。

它不连接任何 Eden 账号，也不假装连着：所有内容存在浏览器 `localStorage`，Chat 只有在你自己配置 `OPENAI_API_KEY` 时才会真的回答，其余一律明说“本地”。

- 栈：React 19 + TypeScript + Vite 8，无 UI 框架、无状态库
- 服务：一个 Node `http` 进程，只监听 loopback，静态托管 `dist/` + `/api/health` + `/api/chat`
- 产物：`dist/` 1.3 MB，JS 322 KB（gzip 98 KB），CSS 38 KB（gzip 7.4 KB）
- 源码：25 个 `.ts/.tsx` 文件，最长的页面文件也在 400 行以内

## 快速开始

```bash
cd 08-ydy
npm install          # 已装过可跳过
./start.sh           # 构建（如未构建）并在 http://127.0.0.1:7817 启动
```

开发模式：

```bash
npm run dev          # http://127.0.0.1:5173，/api 代理到 7817
```

要让 Chat 真的回答：先起 `npm start`，再用环境变量启动，例如 `OPENAI_API_KEY=… OPENAI_BASE_URL=… YDY_MODEL=… ./start.sh`。没有 key 时 `/api/chat` 返回 503 并说明原因——不会伪造回答。

## 一句话对照：Eden 有什么，YDY 做到哪

| Eden 层 | YDY 实现 | 状态 |
| --- | --- | --- |
| 侧栏 + 272px 布局 + Research/Create 分组 + Open in Pane | `src/components/Sidebar.tsx`、`src/components/Pane.tsx` | 真做，分栏可用 |
| Library（All items、三态视图、Index 面板、搜索、筛选、收藏） | `src/Library.tsx` | 真做，12 条本地种子 |
| Boards（看板 + 预览拼贴 + 新建） | `src/Library.tsx` `Boards` | 真做 |
| Discover（Discover/Creators/Brands/Lists、Posts/Ads、Breakouts 等排序、分类、保存） | `src/pages/DiscoverPage.tsx` | 真交互，内容为**本地样本**，页内横幅写明 |
| Strategy（Pillars / Signature / Map） | `src/pages/StrategyPage.tsx` | 真做，Map 为点阵 + 曲线 SVG |
| Planner（Idea → Draft → Make → Edit → Posted 五列） | `src/pages/PlannerPage.tsx` | 真做，点击移动卡片 |
| Publish（Drafts / Scheduled / Composer） | `src/pages/PublishPage.tsx` | 真做，未来时间校验；发布本身不外发 |
| Chat（对话 + 上下文选择 + 停止生成） | `src/pages/ChatPage.tsx`、`server.mjs` | 真接口；未配置 key 时 503 |
| Custom AI（助手列表 + 指令编辑） | `src/pages/CustomAIPage.tsx` | 真做 |
| Analytics | `src/pages/AnalyticsPage.tsx` | 本地统计，并明说“不是实时图表” |
| Your store（四步编辑器） | `src/pages/StorePage.tsx` | 草稿本地化，不收款 |
| Settings（外观 / 数据导入导出） | `src/pages/SettingsPage.tsx` | 真做，导出 `ydy-workspace.json` |
| Trash、⌘K 命令面板、N 新建、深浅主题、移动导航 | `src/App.tsx`、`src/components/CommandPalette.tsx` | 真做 |

Eden 里属于账号/付费能力的东西（社交账号连接、广告库、Auto-DM、DM Flow、分析仓库、Stripe/商店结算）在 YDY 里一律显示为**权限或连接状态**，而不是空数据——这是 Eden 自己的错误语义（`upgrade-required` / `not-enabled` / `unavailable`）在界面上的对应物。

## 视觉一致性

数值来自公开 bundle 字面量与无登录浏览器的 computed style（详见 `research/visual-reference.md`）：

| 项目 | Eden 观测值 | YDY |
| --- | --- | --- |
| 页面底色 / 侧栏 / 卡片 | `#fcfcfa` / `#f5f4f1` / `#ffffff` | 同（`src/styles.css` token） |
| 暗色 | `#1a1a1a` / `#252525` / 绿 `#73b490` | 同 |
| 主文字 | `#272523` | 同 |
| 字体 | Geist（全站） | 同一份 `geist.woff2` |
| 侧栏宽 | 272px（min 248 / max 480） | 272px |
| 导航行 | 紧凑 30px / 14px，V2 42px / 14.5px | 30px / 14px，品牌行 42px |
| 瀑布流 | **容器** ≥420→2、≥910→3、≥1150→4、≥1500→5，gap 16 | container query 同断点，另加 ≤520 单列 |

对照用的真实截图在 `reference/screenshots/`（Library 索引视图、Discover Breakouts、侧栏 Open in Pane），YDY 自己的渲染结果在 `qa/`。

## 验证

一次跑完：

```bash
npm run build            # tsc --noEmit + vite build —— 通过
npm run test:coverage    # 26 个用例（reducer 12 + 页面模型 14），state.ts 语句 94.33% / 分支 94.11% / 行 100%
node --test tests/server.test.mjs   # 8/8：health、503、405/415/400/413、校验、注入上下文、上游 502、静态/SPA/穿越、Host+Origin 403
node tests/browser.mjs   # 48/48：三视口渲染、12 个页面、搜索、索引、收藏、新建、⌘K、暗色、分栏、移动导航、无 console error
```

浏览器 QA 覆盖 1440×900、768×1024、390×844 三个断点，逐项结果在 `qa/report.json`，截图：

| 截图 | 看什么 |
| --- | --- |
| `qa/library-1440.png` | 三列瀑布流、272px 侧栏、指标徽章 |
| `qa/library-index-1440.png` | Index 面板：TOPICS 彩点计数 + PEOPLE |
| `qa/discover-1440.png` | Discover 大标签 + Breakouts 排序 + 本地样本横幅 |
| `qa/pane-1440.png` | Open in Pane 右侧分栏 |
| `qa/planner-1440.png` | 五列看板 |
| `qa/palette-1440.png` | ⌘K 命令面板 |
| `qa/library-dark-1440.png` | 暗色主题 |
| `qa/library-768.png` / `qa/library-390.png` / `qa/mobile-nav-390.png` | 平板、手机与移动导航 |

## 目录

```
08-ydy/
├── src/
│   ├── App.tsx            外壳、路由、持久化、快捷键、分栏
│   ├── state.ts           reducer + parseWorkspace + filterItems（有测试）
│   ├── seed.ts            12 条本地种子、3 个看板、3 张计划卡
│   ├── types.ts           状态与动作类型（唯一事实源）
│   ├── ui.tsx             图标注册表、品牌标记、Dialog、EmptyState
│   ├── Library.tsx        Library / Boards / 卡片
│   ├── ItemDialog.tsx     新建与编辑、上传校验、加入计划
│   ├── components/        Sidebar、CommandPalette、Pane
│   └── pages/             Discover、Strategy、Planner、Publish、Chat、CustomAI、Analytics、Store、Settings、page-model
├── server.mjs             loopback 服务 + /api/chat（有测试）
├── tests/                 server.test.mjs、browser.mjs
├── public/assets/eden/    23 个 Eden 公开素材 + Geist
├── reference/             公开 bundle 与研究用原始页面
├── research/              四份证据报告
├── qa/                    浏览器 QA 截图与 report.json
└── start.sh
```

## 研究档案

| 文件 | 内容 |
| --- | --- |
| `research/raw-audit.md` | 01-raw 159 个文件的逐项审阅：131 个工具、SKILL 路由、13 份参考、21 个内置技能、33 节课程、OpenAPI 差异 |
| `research/eden-tool-tour.md` | 对 Eden MCP 的真实只读巡检：30 次调用、27 成功 3 权限门槛、真实 ID 与不可验证边界 |
| `research/existing-audit.md` | 02-analysis / 05-product / 07-persona 等历史实现的审阅与缺陷清单 |
| `research/visual-reference.md` | 公开前端 token、侧栏、断点、路由、素材与观测边界 |
| `research/implementation-contract.md` | YDY 的验收契约：隔离目录、视口、交互、内容状态、验证口径 |

## 事实与边界

- **没有对 Eden 做任何写入**：巡检全部只读，没有发布、发消息、购买、删除，也没有创建 Eden 聊天。
- **没有伪造 Eden 数据**：真实工作区里只有 3 个条目、没有文档/表格/商店对象，所以 YDY 的种子内容明确标注为本地样本，不冒充你的账号数据。
- **Chat 不会凭空回答**：没配 key 就是 503；配了 key 才走 `/chat/completions`，上游失败映射为 502/504，不会返回空成功。
- **服务只在 loopback**：校验 Host 与 Origin，拒绝跨源和路径穿越，请求体上限 256 KB，每分钟 30 次。
- **git 不可用**：本机未同意 Xcode license（`xcrun` exit 69），所以没有提交历史，验证靠 `tsc`/`vite`/`vitest`/`node --test`/Playwright 的可复现输出。
- **REA 部分受限**：`analyze_javascript_application` summary 被同一 license 问题阻断，仅保留 partial Evidence，静态字面量检索仍可用；未修改宿主配置。
- **像素级对等只在 `qa/` 覆盖的视口成立**：登录后的真实 Eden 内部（发布、商店后台、分析仓库）没有观测，因此不做复刻声明。
