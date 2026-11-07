# YDY 原始材料审计
## 0. 范围、方法与最终覆盖
- 服务目标：YDY 网页高保真复刻的模块、实体、状态、工作流及视觉依据。不是运行原材料里的内容创作/安装工作流。
- 全量输入：`01-raw`，159 个文件、2,214,857 字节；145 Markdown、1 TXT、2 JSON、10 HTML、1 `.DS_Store`。**158/158 文本、JSON、HTML 已审阅，1 个系统元数据文件仅登记。**
- 156 个非 JSON 文本均用 read 读至结尾；长文件分页。7 文件的40个超长单行触发读取器2000字符截断，已在本报告临时附录内按180字符换行后补读全部尾段，临时附录已移除。原件未动。
- 两个 OpenAPI 均 JSON 结构解析成功：遍历 operations、参数、required、responses；关键嵌套状态/枚举另检；根 OpenAPI 全1144行 read 完，工具级单行大 JSON 的对应说明由 tool-descriptions 全1130行分页 read 校准。没有把“JSON能parse”冒充全业务运行验证。
- 已加载 host skills：codebase-onboarding、eden-mcp；已读 ECC common/security、development-workflow。只写本报告；未执行材料中的安装命令、prompt、账号、发布、支付、Telegram、计划任务等指令；未进行任何 Eden 账号写操作。
- 分组：根2；builtin-skills36（21 skills+index+13 refs+report）；custom-ai36（instructions+builder-guide+33 knowledge+index）；skill14（SKILL+13 refs）；tools4；workflows66（10组共65文件+download report）；系统元数据1。末尾逐文件表可复核。
## 1. 复刻模块建议（建议，不是实测导航树）
|模块|要复刻的页面/子区|关键依据|
|---|---|---|
|应用壳层|工作区、左导航、Boards文件夹树、主区、并排pane|[Day5](<../../01-raw/custom-ai/knowledge/06-day-5-your-first-post.md#L27-L35>)、[Day15](<../../01-raw/custom-ai/knowledge/16-day-15-pick-your-long-piece.md#L18-L25>)|
|Discover|Posts/Creators/Breakouts/Lists；有机帖与广告独立；搜索/平台/时间/排序；帖子/创作者详情|[Day4](<../../01-raw/custom-ai/knowledge/05-day-4-study-what-already-works.md#L10-L17>)、[workspace/social](<../../01-raw/skill/references/workspace-and-social.md>)|
|Library + Boards + Documents|All Items/Index、AI drafts；丰富卡片、短Card、Document、Table；section chips；添加菜单；多板放置|[Day3](<../../01-raw/custom-ai/knowledge/04-day-3-never-lose-an-idea-again.md#L9-L16>)、[Day19](<../../01-raw/custom-ai/knowledge/20-day-19-one-piece-a-week-of-posts.md#L9-L16>)|
|Strategy → Planner|quiz、signature、Columns/Map、pillar/topic/angle/idea、Use→Add to plan、动态stage看板/table|[Day1](<../../01-raw/custom-ai/knowledge/02-day-1-your-intellectual-signature.md#L12-L23>)、[Day2](<../../01-raw/custom-ai/knowledge/03-day-2-your-content-map.md#L8-L17>)、[strategy reference](<../../01-raw/skill/references/strategy.md>)|
|Publish|Drafts/Queue/Calendar、composer、账号平台、媒体/thread/article、排期、now、失败与签核|[scheduling](<../../01-raw/skill/references/scheduling.md>)、[工具说明](<../../01-raw/tools/tool-descriptions.md#L423-L435>)|
|Analytics|时间窗/deltas/followers/top posts/topics/formats；按Comments/Likes排序；单帖详情、缺失数据态|[Day14](<../../01-raw/custom-ai/knowledge/15-day-14-halfway-look-at-your-numbers.md#L8-L14>)、[analytics contract](<../../01-raw/tools/tool-descriptions.md#L231-L237>)|
|Eve / Chat / Custom AI|聊天、@上下文、Save as document、模型picker、4 starters、知识、课程、Memory、Updates/Routines|[Eve](<../../01-raw/skill/references/eve.md>)、[Custom AI](<../../01-raw/skill/references/custom-ai.md>)、[routines](<../../01-raw/skill/references/routines.md>)|
|Store|Your page左编辑右预览；Products四步；Email/Customers/Integrations；课程/社区/表单等后续|[Day23](<../../01-raw/custom-ai/knowledge/24-day-23-set-up-your-store.md#L8-L17>)、[Day24](<../../01-raw/custom-ai/knowledge/25-day-24-build-your-first-product.md#L14-L19>)、[Day25](<../../01-raw/custom-ai/knowledge/26-day-25-write-its-page.md#L10-L20>)|
首批优先：**shell/panes、Discover→save、Library/Board→Document、Strategy→Planner、Publish、Analytics、Custom AI course、Store四步**。其它功能保留入口与真实的局部状态，不把一个报告dashboard当全产品。
## 2. 证据分层：像素、行为、模板不混用
|层级|材料|可支持|不能支持|
|---|---|---|---|
|A 待取像素|课程里的public.eden.so JPG及alt|识别原页面和控件、后续取图校准|本审计没有取图/观像素，不能宣称测得边距字体|
|B 行为契约|MCP skill/reference、description、OpenAPI|实体、字段、动作、错误、权限边界|不能推出sidebar宽度、圆角、图标、实际布局|
|C 教程|Sprint lessons|点击路径、页面术语、产物关联|教程可过时，平台外发帖/改bio不是Eden内建操作|
|D 报告模板|10个workflows assets HTML|代理生成memo/plan/offer的HTML/CSS|**不是Eden app原始UI**；不把其720px报告容器当应用设计|
|E 导出索引|index/_report/download-report|文件数量、出处、缺件与保真风险|摘要/哈希回读不证明原服务字节真实性|
10个HTML均为带`{{...}}`占位的自包含报告，没有应用路由、sidebar、API或交互状态系统。大部分浅底`#fafaf8`、卡`#fff`、暗底`#121211`、system sans、14px卡圆角；accent分别绿/蓝/铜/琥珀；Short-Form与Promotion默认暗色。这些是**模板实见CSS**，不是app token。Command Center宽1060、ideas memo860、outline/offer/promotion760、一般memo720、daily posts680，也说明它们是不同成果版式。
## 3. 数据与状态模型（文档契约，非运行测量）
### 3.1 Library / Board / Document / Table
- canonical item与board placement分离：一个帖子可在多个board；移到第二板不删第一板。删board留Library；Trash item移除所有板放置，内容可恢复。来源：[workspace writes](<../../01-raw/skill/references/workspace-and-social.md#L155-L182>)、[Trash descriptions](<../../01-raw/tools/tool-descriptions.md#L978-L990>)。
- Board是canvas；Document底层markdown；Card短文本无title、无自选颜色，随明暗主题；文件夹只组织Boards；section chips过滤板内容；右键/底部+提供Create a document/Create a card/Add from library。
- 文档/board/chat可并排pane；@ item或board绑定聊天上下文；hover回复→Save as document；文档可嵌live table及视频/音频。未知：真实编辑器工具栏/协同光标/drag命中区域。
- AI新建且未上板的Document/Table在Library的AI drafts，不进入默认主库；用户keep/edit/pin/放板后转为正式项；未触碰30天归档。
- Table：typed schema；table/list/board/calendar；saved view + AND filters + hiddenColumns共享；read返回全rows而不是仅可见rows。重复任务done会滚日期、仍保持open，不能追加重复任务伪造recurrence。
- Connections区分manual/mention，语义suggestion不是已连边；用户tags与AI topic tags不是同一命名空间。
### 3.2 Strategy / Planner
- quiz Start→多项回答→Build my strategy；generating→先pillars后topics；signature折叠卡可逐行编辑，含Mission/Where they are/Who they become/Story/Beliefs/Shaped by。
- Columns↔Map；pillar=name+lens+claim；topic含proof，null表示手工；angle chips筛ideas；Add an idea免费；Use→Add to plan。
- Planner是Library的带Posts列table；每个表schema/stages可变，按new/review/scheduled/done语义role，不固定列名；Research/Draft引用既有board/doc。
- linked Posts驱动row的stage与日期；若回草稿/取消应回退；不要排期后独立覆盖planner状态。onPlanner表示已在计划，不能当新idea重复提案。
- 原[reference](<../../01-raw/skill/references/strategy.md#L38-L65>)自身“tables不支持archived”与后文“archived即Remove from Table”冲突。应以运行工具/UI校验后定，当前只列为兼容分支。
### 3.3 Publish / Analytics / automation
- post：draft / scheduled / publishing / posted / partial / failed / cancelled；draft无时间；scheduled进入queue/calendar；publishing/posted不能再编辑/取消。queue slots变更不移动已经queued的post。
- 客户sign-off：not_sent / waiting / approved / changes_asked / edited_since_approved / edited_since_sent；canPublish=false时在发布时间hold回Drafts。
- TikTok送app draft可status=posted但无公开链接；Substack自有scheduler仍status=scheduled。界面应显示目标级原因，不一律“已公开”。
- composer需要账号；New draft自动保存；platforms与accounts分开；media共享/平台专属、segments、article variants；IG/TikTok需要媒体，YouTube为1个竖Short并独立title；Story与Reel不是同态。
- analytics：not connected / activating / syncing / ready / unavailable / tier-clamped / YouTube delayed；null/缺字段≠0。自己的private warehouse与public creator baseline分开。
- Auto-DM：active / paused / paused for credits / waiting for next post；Flow：draft / active / paused，conversation有finished/handoff/stop等；触发→消息→plain-language条件→capture→split→action，不能画成无状态button流程。
### 3.4 AI / course / Store
- AI definition、sources、revision、visibility、workspaceAccess、memoryMode分离；managed可sources=[]但33 bundled sources存在。4个starter上限；chat running/answered/conflict与编辑revision conflict要分开。
- 课程：Start here+Day1–30+2 resources；Mark as done显示lesson list check；prompt Copy；app链接新tab，课程原tab保留。knowledge32只有表名占位，33是截断图像描述，均非完整实体导出。
- 产品：Custom AI / course / download；cohort/workshop/coaching/community/newsletter/Ask me是扩展类型；Add an AI开关不改变展示类型；membership是价格模式。
- 产品编辑：Configure（chat on才有）、Knowledge/Lessons/Contents随类型；Contents→Offer→Page→Publish。buyer knowledge/instructions是published snapshot；page copy/price/welcome可保存即影响live，不能把所有“save”都当仅draft。
- Store编辑器：Your page左侧photo/name/bio/links、右侧live preview；named look九种；product/page的title/tagline与headline/subheadline分开；发布checklist含handle/support/payment等条件。
- form draft→published→closed；edit不改live直到publish；quiz/application/form三kind；pending/accepted/declined与auto-declined；重复申请必须人工处理。
- 社区：Chat / Forum / Events / Products；channel与Forum category分开；rules→join questions→welcome；closed channel可读不可写，delete永久；locked/onlyBuyersOf可使整个section隐藏；resources是forum members-only attachments，不是一个伪Resources产品步骤。
## 4. 十个工作流（业务闭环，不等于应用导航）
|Workflow|输入/处理|交付与边界|文件数|
|---|---|---|---|
|Weekly Strategist|settings→own scoreboard→market sweep→grade prior bet|最多3 findings、3 plays、watchlist；周memo|6|
|Head of Content|review→market→approved week slate→production|最多7 scheduler drafts + week report；不自动发布|6|
|Content Command Center|connect→analytics→five stations|Analyst/Scout/Strategist/Planner/Repurposer；可选Telegram/refresh|6|
|Personal Brand Strategist|访谈→research→topic tree/positioning|strategy、swipe file、first5 hooks；可选drafts|6|
|Idea Engine|workspace+market+tangent→dedupe|5–8 cards、至少2证据腿；选择后draft|6|
|Weekly Content Strategist|throughline→scoreboard/market/library→grade→evolve|10+short、3–5long ideas，standing notes；喂给Short-Form|7|
|Long-Form Outliner|source map→interview→stress test→3 routes→packaging|beat-by-beat outline与rehook map；不是全文|7|
|Short-Form Specialist|voice/log→weekly memo/material→research→5 angles|选后1–3 posts，scheduler draft/log；不自动设time|7|
|Offer Consultant|brand/own posts→what to sell→value equation|Offer Blueprint+interview；定offer，不写sales page|7|
|Marketing Strategist|Offer Blueprint/brand→awareness诊断→leads/hooks|30 promotions、5–7emails、landing-page brief、log；不是发送系统|7|
共65工作流文件全读，加[下载报告](<../../01-raw/workflows/_download-report.md>)为66。可用链：brand→weekly ideas→outline/short draft→publish→analytics；offer→promotion→store/email。不要实际运行外发步骤。
## 5. 视觉外链来源与缺口
- 课程共66图片引用、65唯一URL：31个`graphics/`信息图，34个非graphics截图引用。JPG/alt是待核验视觉线索，不是本机已检查的像素。下一节会列34个截图URL及出处。
- 最有价值：Strategy quiz/signature/Map/Use；Library Index；Discover Breakouts；sidebar Open in Pane；doc+chat、doc+board双pane；Post ideas section；My week table；Store Your page/Offer/Page/Publish。
- 本地01-raw没有PNG/JPG/SVG/WebP、app DOM、前端源码、HAR或完整截图集。没有可靠的sidebar尺寸、font、icon、modal、menu、toast、hover、drag、loading skeleton、responsive breakpoints；实现值应标为推定，不能声称像素还原。
## 6. 冲突、来源可信度与完成边界
1. **API数量已解开**：[根OpenAPI](<../../01-raw/tools/openapi.json#L302-L307>)声明toolCount115但toolNames/tools数组各118；[工具级JSON](<../../01-raw/tools/mcp-openapi.json>)117 operations=115 eden工具+listTools/uploadMedia。多的3个是read_card/create_sticky_note/create_scheduling_draft弃用alias，不是三套功能。
2. public spec明确排除invite-only工具；Strategy/Eve/community/DMFlow等在skill内出现但未必在该JSON。缺operation不能推断产品无该模块，亦不可仅凭skill声称当前账号具备。
3. [builtin refs导出报告](<../../01-raw/builtin-skills/references/_report.md#L28-L60>)明确13 refs由Eve读后模型中介输出，非服务端字节直读；多次相等与本地SHA校验只证明副本一致，不证明与官方源逐字相同。其index早期“未导出”已被当前13文件及report覆盖。
4. [knowledge index](<../../01-raw/custom-ai/knowledge/index.md#L57-L65>)承认多数补末尾换行，Day5两个排版字符ASCII化；“全库源字节原样”不成立。instructions包含后加中文分析，不是纯instructions正文。
5. stale文档冲突：连接指南仍提ChatGPT Developer mode，install已说2026-10删除；Auto-DM旧文1credit而工具描述0.5；board section旧ref说只links且不merge，新description是posts/items也可section、匹配title复用；community assembly仍有eden_live且说tag questions unavailable，新ref已retired且支持tags；own checkout included credits旧说不能，新selling明确可以从prepaid余额支付。
6. “广告跑30天=转化证明/没搜到=niche太窄”是workflow的策略假设，不是观测事实：run days只表明持续投放、不证明利润；搜索缺失不证明市场不存在。复刻不应固化这些推断。
7. 完成的是**静态全文件审计**。未做live账号读写、截图获取、network replay、真实发布/支付/协同/通知验证。下一轮优先截图校准，而非更多marketing文档。
## 7. 验证摘要
- 全文件登记159；正文覆盖158，系统元数据排除1；无未读文本文件。
- 长行补读：7文件40单行，549行临时换行附录，6页全部读完后移除；这只是显示变换，不修改来源。
- 两JSON结构有效；主状态枚举、平台、table types/views、Custom AI visibility/access/memory、form状态、email动作已交叉核对。
- 本次所有事实统计只读；唯一最终写文件为本报告；未改原件，未调用Eden账号工具。
