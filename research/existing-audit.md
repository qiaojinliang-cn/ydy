# 现有资产审计（task-3）

更新时间：2026-11-07 20:20（Asia/Shanghai）。审阅者 existing-review。状态：完成。目标库存共70文件、767,328字节：45个源码/配置/项目文档均全文读取；22份历史会话JSON和1份profile仅检查结构/产品行为；2张图片逐张查看。唯一写范围是本报告；未修改、启动或重跑原产品，审计工具未直接读取凭据文件或发起付费模型调用。历史运行记录只作证据，不作新授权。只执行GET健康检查、语法检查和内存内/preview-only探针。

## 1. 先给实现者的结论

- 可以直接复用的不是 React 项目，而是两个 **Node 原生 HTTP + SSE / 原生 DOM + CSS** 原型。二者零 npm 依赖，无构建环节。不得把已有方案当成已验收实现。
- **07-persona 是较好的对话壳**：逐条追加文本节点、requestAnimationFrame 合并 delta、IME 回车保护、接近底部才跟随滚动、系统深浅色、reduced-motion、输入区 safe-area；服务端有 AbortController、40 条模型历史上限、会话原子落盘。
- **05-product 是工作台功能零件库**：多会话、搜索、删除、工具卡片、层装配面板、7 个本地工具、双模型协议。14 个 lib_* 工具只是规格，不能声称已实现。
- 两个原型都只绑定 127.0.0.1，但都没有应用级认证、Host/Origin/CSRF 校验或速率限制。不能直接改成公网监听。

## 2. 现成运行环境（本轮只读实测）

| 项目 | 当前观察 | 证据 |
|---|---|---|
| Node | v26.7.0，/Users/qiaojinliang/.local/bin/node | node --version / command -v node |
| pnpm | 当前 PATH 未发现 | command -v pnpm |
| 07-persona | PID 70725，cwd 为 07-persona，127.0.0.1:7790 正在监听 | lsof 监听与 cwd |
| 健康检查 | GET http://127.0.0.1:7790/api/health → HTTP 200；app=07-persona，codex-responses / gpt-6.1-sol，credential 元信息 ok、未过期 | 只读 GET；没有复制最后装配中的私人内容 |
| 05-product | 默认 7788 未监听，curl connection refused / HTTP 000 | 本轮连接探测，不是业务返回 |
| Chrome CDP | 9222 /json/version 为404，9223拒绝连接 | 不存在可直接使用的已验证 CDP 端点；未重复探测或擅自启动 |

启动参考（**本轮未执行**）：`node 05-product/server.mjs`（默认7788）；`node 07-persona/server.mjs`（默认7790，已在运行，别重启）。PORT 环境变量可覆写。LIBRARY_DIR 在05服务端健康展示和工具层的含义不完全一致，见下。

## 3. 重要缺口与安全边界

### 高优先级

1. **05 写区隔离不成立（静态确认 + 无落盘preview-only验证）**。[tools.mjs](<../../05-product/src/tools.mjs#L194-L251>) 先补 `06-library/` 前缀，随后 `path.resolve`，只检验是否留在整个项目根内；含父目录段的相对目标可离开06-library。没有 realpath / symlink 逃逸检查。要独立把规范化后的写目标限制在 WRITE_ROOT 下，拒绝 symlink，并使用原子提交。
2. **05 的预览不是服务端授权机制**。write_note 直接接受模型传来的 confirm:true；不存在用户批准记录或绑定内容/目标/hash 的单次 preview token。baseHash 防旧版本覆盖，但不防“预览A执行B”。[tools.mjs](<../../05-product/src/tools.mjs#L194-L251>)。
3. **baseHash 实现/声明漂移**。已有文件写入必须带 baseHash，但 write_note 的工具 schema 没有 baseHash，模型无法可靠从声明学到正确协议。[tools.mjs](<../../05-product/src/tools.mjs#L207-L221>)、[schema](<../../05-product/src/tools.mjs#L329-L345>)。
4. **07 的记忆有写入能力，不是纯只读聊天**。模型输出标记被剥离并自动写入全局 profile；代码不限制五个 key、不绑定用户、不记录来源/批准、不提供删除入口。profile 被直接拼进 system，存在跨会话污染与指令注入边界。[memory.mjs](<../../07-persona/src/memory.mjs#L15-L77>)、[server.mjs](<../../07-persona/server.mjs#L106-L137>)。只能把它当本机单用户试验。
5. **默认模型通道直接读取宿主 OAuth 记录**。两份 model-responses.mjs 相同，访问固定远端 Responses 接口；没有刷新能力。历史记录中“不会额外花钱”不能作为部署/计费保证。新产品应注入明确配置的模型适配器，不能将凭据值或提取脚本复制到新前端、报告或库。

### 运行/功能漂移

- **05 的 L2 文件缺失**：router 指向 src/prompt/refs，但当前库存无该目录/文件；命中只形成 routed.error。不能声称13本手册已经接入。[router.mjs](<../../05-product/src/router.mjs#L79-L122>)。
- **07 的离线兜底失效**：实际按 references/<中文slug>.md 读取，六份草稿却在 references/_draft/<英文slug>.md，名称与目录均不匹配；外部 vault 不存在时静默没有L2。[router.mjs](<../../07-persona/src/router.mjs#L10-L15>)、[readReference](<../../07-persona/src/router.mjs#L101-L113>)。
- **07 有两个硬编码外部依赖**：概念库和官网信件库都在个人 Obsidian 路径；源码不是可携带成品，需改成配置/明确来源适配，不能把私人库整份复制进新产品。[evidence.mjs](<../../07-persona/src/evidence.mjs#L10-L11>)。
- **05 停在8步后没有用户可见的“已达上限”分支**；模型错误后仍发 done(ok:true)。Responses 客户端把 auth 写成字符串，服务端却按数字401判断，鉴权分类不一致。[server.mjs](<../../05-product/server.mjs#L320-L379>)。
- **05 会话重开把所有非user消息当助手正文**，工具JSON会变成助手消息；有工具轮次的文本又累加进最终assistant，存在历史重复/混杂。[app.js](<../../05-product/public/app.js#L150-L167>)、[server](<../../05-product/server.mjs#L340-L377>)。
- **05 无真正的确认按钮**：CSS 有 tool-actions，app.js 没有生成确认/取消UI，也没有PATCH重命名UI；移动端侧栏被移出屏幕但没有开关。[app.js](<../../05-product/public/app.js>)、[style.css](<../../05-product/public/style.css#L438-L450>)。
- **07 判断门禁仅提示词**：diagnosisState 只看先前profile，不先解析本轮用户输入；历史资料满足门槛会影响新会话，新主题不重置诊断，sticky会一直复用上次slug。缺槽不代表本轮没说，槽满不代表新主题足够。
- 两个SSE解析器均按LF分帧，未处理完整事件/流结束确认、尾部残片与usage。07前端未消费done；中途断流但已有文本时可能看似成功。05每个delta重算整段markdown，07文本追加更适合复用。

## 4. 服务端接口与数据流

### 05-product（现实现）

| 方法/路径 | 行为 |
|---|---|
| GET /api/health | 返回模型通道标签、library路径、会话数 |
| GET /api/sessions | 返回按updatedAt倒序的摘要 |
| POST /api/sessions | 新建并持久化会话 |
| GET /api/sessions/:id | 返回完整会话 |
| PATCH /api/sessions/:id | 更新title（120字符） |
| DELETE /api/sessions/:id | 删除Map项和JSON文件 |
| POST /api/chat | text/sessionId；用户消息先落盘→装配→最多8次模型/工具循环→助手落盘 |
| GET /* | 静态public文件，路径词法约束 |

SSE：layers / delta / tool_start / tool_result / error / done。存储：05-product/sessions/*.json；7工具为 stat_library/list_library/search_library/read_file/write_note/list_references/read_reference。无远端 Eden MCP 转发。`tool-spec.md` 规定的14个lib_*不是本实现。

### 07-persona（现实现）

| 方法/路径 | 行为 |
|---|---|
| GET /api/health | 通道/凭据布尔元信息/身份/最近装配/会话与记忆数量 |
| POST /api/session | 新会话并落盘，返回身份/开场白 |
| GET /api/session/:id | 返回user/assistant消息（不含profile正文） |
| POST /api/chat | 校验会话→开场白+本轮消息→关键词选概念+原句检索+诊断→模型流→剥离并自动存记忆→存会话 |
| GET/HEAD /* | 静态public文件 |

SSE：delta / error / done。模型历史最多40条（按消息数，不是token预算）。记忆跨全部会话共享 data/profile.json。无工具调用循环，tools=[]。

## 5. UI 证据（不是 Eden 原站）

已逐张打开 [light.png](<../../07-persona/research/shots/light.png>)（880×1150）及 [dark.png](<../../07-persona/research/shots/dark.png>)（880×900）。观察：窄列居中、顶栏名字/副标题/新对话、宋体助手文字、右对齐暖灰用户气泡、底部圆角输入行。文字和布局与07源码吻合，可证明本地原型风格；图中无URL栏/抓取元数据，**不证明它们来自 Eden，也不证明当前浏览器实时状态**。深色截图输入行部分触底，需新项目另测短视口与长输入。

复用优先序：07对话渲染与排版token → 05会话列表和工具卡/层面板 → 重新实现授权与API契约。视觉设计若要求Eden同款，必须另用经验证原站证据，不能拿07纸面聊天壳冒充。

## 6. 历史材料的可信度

README、02-analysis、03-run-log、04-playbook是重要的路线/模板资产，但不是全部可靠结论。06-library复盘已经纠正：字节换token不是实际每轮账单；一次行为探针不能证明“10/10永远硬约束”；中文回答不能证明额外运行时语言层；先给Day5再问进度与第一人称例句属于反证；首次fetch失败的原因未定位，不能把“冷启动必重试”推广为规则。保留“按需读/先预览/错误闭集/候选与证据分离”，不要继承夸大论断。

历史工具数131、规范117仅指记录时样本，不视为当前服务能力。运行记录中有账号邮箱、内部ID及对话原文；本报告不复制这些内容，不重跑写入/发布/付款/问Eve。

## 7. 逐文件覆盖登记（全部完成）

全文读取：
- [README.md](<../../README.md>)：150行。
- 02-analysis：[00-mechanism-decomposition.md](<../../02-analysis/00-mechanism-decomposition.md>) 259行；[01-skill-layer.md](<../../02-analysis/01-skill-layer.md>) 794行（四段连续读取）；[05-workflow-layer.md](<../../02-analysis/05-workflow-layer.md>) 89行；[06-knowledge-layer.md](<../../02-analysis/06-knowledge-layer.md>) 128行。
- 03-run-log：[00-run-log.md](<../../03-run-log/00-run-log.md>) 297行（两段）；仅作为历史，不复制账号/对话。
- 04-playbook：[00-总纲.md](<../../04-playbook/00-总纲.md>) 161行；[01-分层加载模板.md](<../../04-playbook/01-分层加载模板.md>)141行；[02-句式与门禁库.md](<../../04-playbook/02-句式与门禁库.md>)223行；[03-skill写作模板.md](<../../04-playbook/03-skill写作模板.md>)131行；[04-CustomAI指令模板.md](<../../04-playbook/04-CustomAI指令模板.md>)163行；[05-白话版.md](<../../04-playbook/05-白话版.md>)93行。
- 05-product：[00-plan.md](<../../05-product/00-plan.md>)170行、[recon-model.md](<../../05-product/recon-model.md>)214行、[config.json](<../../05-product/config.json>)8行；[server.mjs](<../../05-product/server.mjs>)400行；[src/model.mjs](<../../05-product/src/model.mjs>)142行；[src/model-responses.mjs](<../../05-product/src/model-responses.mjs>)207行；[src/router.mjs](<../../05-product/src/router.mjs>)157行；[src/tools.mjs](<../../05-product/src/tools.mjs>)417行；[src/prompt/persona.md](<../../05-product/src/prompt/persona.md>)43行；[src/prompt/router.md](<../../05-product/src/prompt/router.md>)25行；[public/index.html](<../../05-product/public/index.html>)58行；[public/app.js](<../../05-product/public/app.js>)434行；[public/style.css](<../../05-product/public/style.css>)450行。
- 06-library：[2026-11-07-Eden机制逆向复盘.md](<../../06-library/2026-11-07-Eden机制逆向复盘.md>)134行。
- 07-persona：[server.mjs](<../../07-persona/server.mjs>)412行；[src/router.mjs](<../../07-persona/src/router.mjs>)207行；[src/evidence.mjs](<../../07-persona/src/evidence.mjs>)164行；[src/memory.mjs](<../../07-persona/src/memory.mjs>)78行；[src/model-responses.mjs](<../../07-persona/src/model-responses.mjs>)207行；[src/persona.md](<../../07-persona/src/persona.md>)60行；[src/router.md](<../../07-persona/src/router.md>)15行；[src/opening.md](<../../07-persona/src/opening.md>)7行；[public/index.html](<../../07-persona/public/index.html>)34行；[public/app.js](<../../07-persona/public/app.js>)259行；[public/style.css](<../../07-persona/public/style.css>)265行；[research/voice-samples.md](<../../07-persona/research/voice-samples.md>)208行；六份 `_draft` 手册每份23行：[attention](<../../07-persona/src/references/_draft/attention.md>)、[identity-and-goals](<../../07-persona/src/references/_draft/identity-and-goals.md>)、[one-person-business](<../../07-persona/src/references/_draft/one-person-business.md>)、[point-of-view](<../../07-persona/src/references/_draft/point-of-view.md>)、[why-steps-die](<../../07-persona/src/references/_draft/why-steps-die.md>)、[writing-as-thinking](<../../07-persona/src/references/_draft/writing-as-thinking.md>)。
- 图片：上述light/dark各已用read_image查看。

- [tool-spec.md](<../../05-product/tool-spec.md>)：1858行全文，按1–310/311–620/621–930/931–1240/1241–1550/1551–1858六段连续读取。它有完整14工具契约、preview_token、分区、锁、缩水保护和索引设计，但未实现；规格里的计数/grep检查不等于行为测试，不应照抄为验收已通过。部分规则也需收敛：lib_read宣称可读集合JSON又称非markdown报错；“无confirm零副作用”与持久化preview快照有语义冲突；只realpath父目录仍未保护最终文件symlink；锁“5秒后可重试”与错误表conflict不可重试并不一致。

### 历史数据（结构检查，未复制标题/消息/profile正文）

05共7会话，37条记录（user10/assistant15/tool12），8个明确toolCalls；其中多个早期JSON含tool记录却无对应调用记录，兼容逻辑不得直接假设历史全部符合现协议。工具结果可解析的状态中有preview1次、written1次；5条是截断或非JSON。这只证明记录过该行为，不是本轮新授权或重新验收。

| 文件 | 记录数 | user/assistant/tool | 结构备注 |
|---|---:|---|---|
| [2c3ccbf9…json](<../../05-product/sessions/2c3ccbf9-924b-44d8-882d-27e30b998075.json>) | 2 | 1/1/0 | 基本对话 |
| [3fe8a18b…json](<../../05-product/sessions/3fe8a18b-eed1-48ae-b070-cf2aae6455c7.json>) | 3 | 1/1/1 | 旧工具结果，无显式toolCalls |
| [59b77318…json](<../../05-product/sessions/59b77318-7445-475f-b37c-ebf329f4a30a.json>) | 3 | 1/1/1 | 旧工具结果，无显式toolCalls |
| [63590069…json](<../../05-product/sessions/63590069-2c56-4987-b282-07b645ce2b8f.json>) | 8 | 3/3/2 | 旧工具结果含截断 |
| [677b3746…json](<../../05-product/sessions/677b3746-d69b-4348-a116-67e3a9dd3519.json>) | 2 | 1/1/0 | 基本对话 |
| [6c4a7168…json](<../../05-product/sessions/6c4a7168-59d8-437c-8e69-c5754943e96b.json>) | 17 | 2/7/8 | 8个调用，list/read/write；含preview与written |
| [b7ce4a26…json](<../../05-product/sessions/b7ce4a26-468a-481b-b876-c5c6d9045676.json>) | 2 | 1/1/0 | 基本对话 |

07共15会话、67条记录（user27/assistant40），无toolCall；5份包含lastRef；2份空会话。全部通过JSON解析，未输出消息原文。

| 文件 | 记录数 | user/assistant | lastRef字段 |
|---|---:|---|---|
| [021421d6…json](<../../07-persona/data/sessions/021421d6-b874-4c4d-89fd-25e9d7802c79.json>) | 3 | 1/2 | 无 |
| [19233224…json](<../../07-persona/data/sessions/19233224-df16-45d2-8521-61f5c8d11811.json>) | 3 | 1/2 | 无 |
| [1c4ff987…json](<../../07-persona/data/sessions/1c4ff987-77e7-4f91-bf8f-d0c935e0a9df.json>) | 17 | 8/9 | 有 |
| [1def1643…json](<../../07-persona/data/sessions/1def1643-0476-4ed9-a6b3-fee62a50217e.json>) | 5 | 2/3 | 有 |
| [283f42f4…json](<../../07-persona/data/sessions/283f42f4-61f3-4b3b-bae9-e3e81cc10bcb.json>) | 5 | 2/3 | 有 |
| [2efd32cb…json](<../../07-persona/data/sessions/2efd32cb-ee28-44e0-a27d-dc3531f9a068.json>) | 7 | 3/4 | 无 |
| [40f19329…json](<../../07-persona/data/sessions/40f19329-9e79-436b-9d94-7f9a28804182.json>) | 0 | 0/0 | 无 |
| [4714c59c…json](<../../07-persona/data/sessions/4714c59c-81c4-4fd1-91a5-d2a58d22910f.json>) | 3 | 1/2 | 有 |
| [4acbfb56…json](<../../07-persona/data/sessions/4acbfb56-8bf2-49c8-8b14-6af9c41ab725.json>) | 3 | 1/2 | 无 |
| [59bf9a86…json](<../../07-persona/data/sessions/59bf9a86-a465-4d7f-b85e-874a6f87d687.json>) | 5 | 2/3 | 无 |
| [5f8d0098…json](<../../07-persona/data/sessions/5f8d0098-e1e9-406b-b488-22bb7462d27b.json>) | 3 | 1/2 | 无 |
| [6819d183…json](<../../07-persona/data/sessions/6819d183-b4e3-4940-a98b-58da9905e5c8.json>) | 5 | 2/3 | 无 |
| [9891fad6…json](<../../07-persona/data/sessions/9891fad6-f611-4355-9a2e-a0fe60fe6c5e.json>) | 5 | 2/3 | 无 |
| [d7ec6279…json](<../../07-persona/data/sessions/d7ec6279-18e6-4d57-b63d-7e610f853bce.json>) | 0 | 0/0 | 无 |
| [f9d4a92c…json](<../../07-persona/data/sessions/f9d4a92c-1773-4180-bf38-4e2e8394c799.json>) | 3 | 1/2 | 有 |

[profile.json](<../../07-persona/data/profile.json>)：普通object，五个预期槽位都为string；不复制值。其已有内容不是任何新会话用户的授权。

## 8. 方法与已加载规范

已检查会话技能目录，加载 codebase-onboarding、frontend-patterns、backend-patterns、security-review、terminal-ops、agent-self-evaluation（含报告模板）；按真实栈审阅原生JS，未错误套React改造。已全文读取common全部10份rules（coding-style/git-workflow/testing/performance/patterns/hooks/code-review/development-workflow/agents/security），以及typescript全部5份rules（coding-style/testing/patterns/hooks/security，该目录覆盖JavaScript）。工具：glob发现、read全文、read_image图片、只读shell状态与内存探针。REA的逆向技能明确普通源码架构分析不必启用反编译器；本任务没有反编译需要。Eden MCP会产生账号侧数据/费用，本轮无需调用。未安装依赖、未创建后台任务，工作区不是Git仓库，不能提供commit/diff基线。

## 9. 可复用前后端与依赖取舍

| 现有资产 | 可复用内容 | 搬迁时必须调整 |
|---|---|---|
| [07 app.js](<../../07-persona/public/app.js>) | textNode追加、rAF、输入法保护、接近底部自动跟随 | 抽出SSE解析器，要求终态done/failed，添加Abort/重试入口、session请求错误处理；不要复制旧sessionId |
| [07 style.css](<../../07-persona/public/style.css>) / [index.html](<../../07-persona/public/index.html>) | 字体/宽度/纸色/暖灰token、系统深浅色、安全区、可访问输入label | 只是本地人物聊天风格，不是Eden原站设计；测试132px长输入时固定dock是否盖正文 |
| [05 app.js](<../../05-product/public/app.js>) | 多会话、筛选、层面板、工具耗时/状态展示 | 会话必须按role渲染；补键盘可操作元素、移动菜单、确认UI；避免全历史重建和每delta全文markdown重算 |
| [07 server.mjs](<../../07-persona/server.mjs>) | HTTP/SSE骨架、断连取消、session原子rename | 用户/会话隔离、并发锁、错误终态、持久化失败回执、专用模型adapter |
| [05 router.mjs](<../../05-product/src/router.mjs>) | 关键词加权top1、阈值、装配报告、粗token计数 | 配置不存在的L2目录；cache不会热更新；token是估算，不是usage |
| [07 router.mjs](<../../07-persona/src/router.mjs>) / [evidence.mjs](<../../07-persona/src/evidence.mjs>) | 概念→标签→英文词干→短原句、frontmatter/wiki清洗 | 配置数据源、保留出处、标识候选、限制token、补检索测试；AI匹配区分大小写，纯小写ai探针无命中；不要复制个人绝对路径 |
| [memory.mjs](<../../07-persona/src/memory.mjs>) | 可分chunk记忆标记剥离状态机 | 格式/白名单要由代码强制，限制单轮条数/长度，结构化来源与删除；带空格变体当前泄漏到UI |
| [model-responses.mjs](<../../05-product/src/model-responses.mjs>) | Responses消息/工具形状映射、增量toolCall拼接 | 两份文件SHA-256一致，可集中成一个adapter；认证注入、超时/Abort、终态确认、usage、完整SSE framing；不携带旧账号凭据 |
| [tools.mjs](<../../05-product/src/tools.mjs>) | 只读list/search/read、hash、preview理念、结构化nextAction | 先修读写分区、真实路径约束、权限与预览授权，再考虑复用写工具；不应原样用于新产品 |

依赖事实：目标目录没有package.json/lockfile/build配置；源码import仅Node内置模块及本地文件；前端没有外部CDN/字体下载。内置fetch/Response/AbortController依赖现代Node，原型未声明engines，当前实测Node26可解析。无数据库、无包安装需求，不代表无外部模型/私有知识依赖。05支持 MODEL_PROVIDER / MODEL_BASE_URL / MODEL_API_KEY / MODEL_NAME；responses模型可配置，07模型名硬编码。05默认服务端LIBRARY_DIR展示为06-library，而工具层LIBRARY_ROOT默认整个项目；统一设置LIBRARY_DIR为06-library时write_note又补06-library前缀，可能得到嵌套写区。应分开 READ_ROOT / WRITE_ROOT / MODEL_CONFIG，避免把环境变量当同一个语义。

## 10. 本轮验证与留给QA的明确边界

| 检查 | 实际结果 | 可证明/不可证明 |
|---|---|---|
| 全部12个JS/MJS执行 `node --check` | 12/12 exit0 | 语法合法，不代表业务正确；未发现现成测试套件/测试脚本 |
| 两份Responses适配器SHA-256比较 | 完全一致 | 可集中复用，不证明远端兼容长期稳定 |
| 记忆标记21种chunk切点 | 规范标记均剥离且记录一次 | 基本跨chunk状态机有效 |
| 任意记忆key | 被接受 | 五槽限制仅存在prompt，运行时未强制 |
| `[[ 记住 ...]]` 空格变体 | 标记出现在可见文本 | regex允许但前缀判定不允许，需统一语法 |
| 05越项目根的read_file | forbidden | 基础词法边界有效，不证明symlink安全 |
| 05规范化后离开06-library的write_note preview | status=preview，willWriteTo位于05-product | 写区边界可绕过；confirm=false，不落盘。随后 `test ! -e` 确认未产生目标文件 |
| 05命中认证L2 | routed.error | 手册缺失被复现，不需要真实模型 |
| 05工具schema计数 | 7；baseHash字段缺失 | 规格/实现漂移已验证 |
| 模拟fetch仅返回delta后EOF | streamResponses仍成功返回文本 | 无response.completed确认；没有发送网络请求 |
| 模拟fetch HTTP401 | err.status为字符串auth | 与05服务器数字401判断不兼容 |
| 07健康GET复核 | 200，15会话/5记忆 | 未增加会话；凭据布尔ok不等于本轮模型端到端已验证 |

未执行的项目：真实模型问答、付费Eden调用、任何confirm写入、原应用POST/DELETE、真实发布、当前UI自动化与跨视口实拍、认证/CSRF动态攻击、并发落盘压力测试。原因是本任务仅允许报告写入，原件保持不变。现有图片支持视觉分析，不代替这些测试。

新产品QA至少覆盖：服务端确认绑定与过期/重放；路径父段/软链/最终目标链接；请求Origin与Host；同session并发/写失败；无终态断流；新话题诊断重置；记忆五槽白名单与删除；移动端菜单/长输入遮挡/键盘focus；模型离线不把echo伪装真模型。原型只可按这些零件复用，不可标成生产就绪。

## 11. 自评与交接

| 轴 | 分数 | 证据与改进点 |
|---|---:|---|
| 准确性 | 4/5 | 全部主张有源文件行号或本轮探针；真实模型及UI运行未验，明确隔离，不把静态推断当运行成功 |
| 完整性 | 5/5 | 70/70库存均登记：45全文、23结构、2图片；接口/环境/复用/安全均覆盖 |
| 清晰性 | 4/5 | 按结论→接口→证据→文件覆盖组织；覆盖表很长，可供下游按需要跳读 |
| 可执行性 | 4/5 | 明确复用模块、接口、启动命令与QA清单；本任务不修原件，缺陷必须在新实现解决 |
| 简洁性 | 4/5 | 总结在前；逐文件表为用户要求的必要篇幅，未附密钥/对话全文 |

总体4.2/5。建议优先修新产品的授权与文件边界，再移植流式渲染与会话组件；原产品不改。自检：交付满足本次只读审计与单文件写范围，lead可直接用本报告分配实现和QA。
