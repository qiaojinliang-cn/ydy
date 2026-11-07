# Eden 公共前端视觉证据

来源：`app.eden.so` 公开 bundle、`eden.so` 营销站、公开课程里带 alt 描述的真实应用截图，以及无登录浏览器在 1440/768 两个断点上的 computed style。所有数值都是观测值，不是猜测；观测不到的写在“边界”一节。

采集者：visual-research 子代理（静态 bundle 解析 + Playwright 点击前的只读测量），报告落盘由 Lead 补齐，证据仍来自它的会话记录与 `partial` REA Evidence。

## 1. 颜色与排版 token

| 项目 | Light | Dark | 来源 |
| --- | --- | --- | --- |
| 页面底色 | `#fcfcfa` | `#1a1a1a` | 1440/768 computed `body` background |
| 侧栏底色 | `#f5f4f1` | `#252525` | `var(--surface-sidebar)` 解析值 |
| 卡片表面 | `#ffffff` | 亮于页面 | computed `--surface-card` |
| 主文字 | `#272523` | 近白 | computed `color` |
| 强调色（绿） | `#3f6b52` | `#73b490` | bundle 字面量 + computed |
| 正文字体 | Geist | Geist | 字体 preload 注释“every screen”；营销站才用 Figtree/EB Garamond |

Geist 字体文件已落到 `public/assets/eden/geist.woff2`，YDY 用 `@font-face` 直接引用同一份文件。

## 2. 侧栏

- 默认宽度 **272px**（Eve/mode 变体 292px），`min 248 / max 480`，HTML 首屏兜底 260px；宽度存 `localStorage: canvas:sidebar:width`。
- 两套行样式：`sidebarV2` 行高 42px、字号 14.5px、圆角 12px；紧凑行高约 30px、字号 14px；外容器 `padding 12px`、`gap 1px`。
- 导航图标 20px、`stroke-width 1.7`，风格接近 Tabler；标签 14px。
- 固定入口：Home / Library / Chat / Creators / Boards / Shared with me，归在 “Research” 分组下。
- 默认可见的可选区块：Discover、Strategy (beta)、Publish、Your store；Auto-DM、Custom AI、Capture 默认 **不开**。
- 悬停出现 “Open in Pane” 胶囊 + 分栏图标（见 `reference/screenshots/sidebar-open-in-pane.jpg`）。

YDY 的对应实现：`src/components/Sidebar.tsx`（272px、30px 行高、Create/Workspace 分组、Recent boards、Search ⌘K、Open in Pane、Collapse、账号行），并在右侧真正落地了分栏 `src/components/Pane.tsx`。

## 3. 瀑布流断点

来自 bundle 的 masonry 常量：**容器**宽度 ≥420 两列、≥910 三列、≥1150 四列、≥1500 五列，`gap 16px`。关键点是“容器”而非视口——所以 YDY 用 CSS container query（`.library-results { container-type: inline-size }`）复现，而不是 `@media`。这也解释了为什么真实 1440px 窗口里是三列：主区宽度约 1100px。

## 4. 路由与页面骨架

`/library → all-items`、`/discover → discover`、`/strategy → strategy`、`/schedule → schedule`、`/chat`、`/analytics`。匿名访问会被重定向到 `/sign-in`（未填表、未登录）。

## 5. 真实截图（可直接对照）

| 文件 | 内容 |
| --- | --- |
| `reference/screenshots/library-index.jpg` | Library “All items”、三态视图切换、右侧 New、Index 面板（TOPICS 彩点计数 + PEOPLE）、三列瀑布流卡片、指标徽章 `1.6x` / `Top 3%`、时长角标、平台图标 |
| `reference/screenshots/discover-breakouts.jpg` | Discover / Creators / Brands / Lists 大标签、Posts/Ads 分段、Breakouts / Hidden gems / Viral now / All-time greats、分类 chip、右侧工具图标、混合卡片 |
| `reference/screenshots/sidebar-open-in-pane.jpg` | 深色侧栏 “+ New / Library / Discover” 与 “Open in Pane” 悬停胶囊 |

## 6. 素材清单

`public/assets/eden/` 共 23 个文件，全部 HTTP 200 校验：`hormozi|dango|bloom|leila|sung|filips` 各一组 `-thumb.jpg` + `-avatar.jpg`，另有 `notebook-thumb.jpg`、`bloom-x-avatar.jpg`、`dan-koe.jpg`、`justinwelsh-avatar.png`、`codiesanchez-avatar.png`、`codie-portapotty.jpg`、`lilla-bjorn-attention.jpg`、`lilla-bjorn-avatar.jpg`、`eden-logo-dark-transparent.svg`、`geist.woff2`。

## 7. 边界与未观测项

- 匿名访问只能到 `/sign-in`，登录后的真实数据、发布流程、商店后台没有观测，**不做推断**。
- REA 的 `analyze_javascript_application` summary 被宿主 Xcode license 阻断（`xcrun` exit 69），只保留 `partial` Evidence `ev_1cdcb84c92bf157b5ae01e88c4cd28fdc6c314f8c9d733d5237552a4782fcee4`；没有重试，也没有修改宿主配置。静态字面量检索仍然可用，上面所有 token 都来自可检索的 bundle 字面量或 computed style。
- 未导入任何登录凭据；未调用 Eden 写接口。
- 因此 YDY 复刻的是**结构与视觉**：像素级一致性只对 `qa/*.png` 覆盖的视口成立，不宣称覆盖 Eden 全部页面。
