# Eden MCP 只读巡检 — YDY 复刻证据

- 执行者：`eden-tour`；共享任务 `task-2` 已 get/claim。
- 日期：2026-11-07，Asia/Shanghai；阶段落盘约20:15。
- 方法：读宿主技能目录 → 加载 `eden-mcp` → 读对应 references → 首个 Eden 调用 `eden_list_workspaces` → 使用返回的真实 ID。
- 只写本文件。没有发布、排队、新建草稿、发送 DM/邮件、购买、删除、编辑、连接账号或执行 AI chat。
- 本文件补充原材料审计与 implementation-contract；不替代它们。通过 task-2 完成记录与 lead 交接引用。
- 最小脱敏：不保存邮箱、用户ID、个人工作区名称、聊天正文或完整课程正文。UUID 仅本地定位，不进入公开 seed。
- 证据分层：Rxx 是本次真实 MCP 回执的字段摘要；schema 是静态能力契约。两者都不能证明网页像素、DOM、hover 或点击行为。

## 1. 已读方法

已调用 host `skill("eden-mcp")`，读取其 `references/connection-and-auth.md`、`errors.md`、`workspace-and-social.md`、`custom-ai.md`、`skills-and-prompts.md`、`strategy.md`、`scheduling.md`、`routines.md`、`selling.md`、`communities.md`、`eve.md`。selling/communities 已读路由与相关规则段，长行存在工具截断，不声称逐字完整读取整个文件。

关键约束：saved Library 不等于 Discover 全索引；managed AI 的 sources=[] 不等于知识为空；不为覆盖研究新 creator/brand；授权失败后停止同凭据重试；read 外观工具中 get_plan 可能迁移旧计划、get_analytics 可能启用 tracking，需特别留意。

当前实际工具 schema 优先于旧 references。旧 reference 对 Auto-DM/搜索信用定价有漂移；本次没有发送或研究新作者，且结果不带账单，因此不声称总成本为0或给精确扣费。

## 2. 真实对象定位（仅本地）

|别名|来自|真实 ID|
|---|---|---|
|W workspace|R01|`1da3dace-c994-4749-84e7-59bbb8535fa0`|
|B board|R02|`95aa2618-86f6-4080-96d1-585ab6b3ed6b`|
|IG_ITEM|R02|`6b21353d-dca2-4b9d-b23a-61f61e8009bd`|
|X_ITEM|R02|`a7e8c10b-a09e-45fb-896a-b12912bb1c42`|
|IG_CONTENT|R02.social|`c56e5ca1-7b25-47cf-9afe-f45ab2a593fb`|
|X_CONTENT|R02.social|`b92fed5e-9e93-4980-83fd-d8f6f93db2b2`|
|AI managed course|R05|`724eb8fa-5b93-5522-a132-1ccd59bb156d`|
|SOURCE_START|R16|`c4748dbd-bc9a-402c-8ee9-faf01c7fd353`|
|SCHEDULE|R13|`989dd2d9-c146-43d5-bd79-f2b05f32afa8`|
|OLD_DRAFT|R19|`566af1b8-fb3d-49f2-931a-ae6300323442`|

已最早向 lead 发送 W 与连接成功，再发 seed/空态/套餐门槛。canonical itemId、social contentId、platformContentId 不可混用。

## 3. 真实只读执行台账（30 次）

表内所有 workspace 参数均显式传 W。未标失败的结果均 `ok:true`。

|证据|工具 / 参数|回执摘要与覆盖|
|---|---|---|
|R01|`eden_list_workspaces({})`|1 workspace，owner，1 member，default=W；凭据可用，账号个资不落盘|
|R02|`eden_list_workspace_items(W,limit:60)`|count=3,totalCount=3,nextCursor=null；完整可见页：1 canvas、1 instagram、1 twitter|
|R03|`eden_read_board(W,itemId:B)`|标题「Eden 机制逆向 / 研究样本」；2 items，position0/1；sticky/text/shape/folderLabel/section 全空|
|R04|`eden_list_skills(W)`|21 builtin，全 enabled；无自建 skill；部分 fileCount>0，见 seed|
|R05|`eden_list_custom_ai(W)`|1「The 30-Day Creator Sprint」，Course，managed，revision1，chatEnabled=true，guided，selected access，memory off，33sources|
|R06|`eden_search_workspace_items(W,type:markdown,limit:10)`|totalCount/count=0,nextCursor=null；没有可供 get_note_markdown 的真实 ID|
|R07|`eden_search_workspace_items(W,type:table,limit:10)`|同上；没有可供 read_table 的真实 ID|
|R08|`eden_list_tags(W)`|count0,tags=[]；用户 tag 空，不能混同 AI topic tag|
|R09|`eden_list_chats(W)`|count38，所列均 idle；主要旧研究读取/探针，另有 Course chats；不读取正文、不创建聊天|
|R10|`eden_get_custom_ai(W,AI)`|完整 instructions 可读，4 starters；managed sources=[]，知识用 R16 独立读取|
|R11|`eden_get_skill(W,builtin:table-builder)`|完整 YAML frontmatter+skillMd，files=[]；作为结构样本查看，不执行写入流程|
|R12|`eden_get_strategy(W)`|status:none,strategy:null；「No strategy yet. They make one on the Strategy page in Eden (https://app.eden.so).」|
|R13|`eden_list_schedules(W)`|1 default schedule，Asia/Shanghai，每天04:15/06:15/08:30；accounts/platforms=[]；动态 nextFreeSlots|
|R14|`eden_list_routines(W)`|count0,limit20,routines=[]|
|R15|`eden_get_seller_overview(W)`|usd；handle=null/required；Stripe not_connected；0products/live/sales；products/bundles/sellableCustomAIs=[]，creatorPage/referrals=null；saleConnection/checkoutConnections=Unknown，不可当 false|
|R16|`eden_search_custom_ai_knowledge(W,AI)`|catalog 33items，readable全true；Start here+Day1…30+plan stub+library resource；字段sourceId/label/kind/access/mediaType/fileName/sizeBytes/previewText；本次未返回sections，不臆造模块|
|R17|`eden_following_overview(W,limit:5)`|totalFollowedCount/count0,truncated=false,follows=[]|
|R18|`eden_get_plan(W,limit:10)`|planner=null,cards=[],total0,truncated=false,archivedCount0,weekdays={}；五列Idea/Draft/Make/Edit/Posted；提示添加才创建Content planner，本次未创建|
|R19|`eden_list_scheduled_posts(W,mode:compact,limit:10)`|1条既存draft，scheduledFor=null，X text target pending，Asia/Shanghai；不是本次创建、不是已发布|
|R20|`eden_connect_social_accounts(W,action:status)`|connections=[]；不调 get-link/sync/OAuth|
|R21|`eden_list_auto_dm_rules(W)`|失败：status:error,httpStatus402；「Auto-DM is available on Pro and Max plans. Upgrade to use it.. Upstream Eden service returned a non-2xx response. Surface the message to the user and suggest retrying in a moment.」语义为套餐门槛，不当瞬时故障重试|
|R22|`eden_list_dm_flows(W)`|同一并行组返回与R21相同402/Pro-Max门槛；非R21后的重试；其后停止该族|
|R23|`eden_analyze_list(W)`|无query/listRef，roster-of-lists，count0,lists=[]；无新creator拉取|
|R24|`eden_get_analytics(W,days:7)`|失败：upgrade-required；「Analytics needs a Starter, Pro, or Max workspace. The user can upgrade at https://app.eden.so/?settings=billing — mention the upgrade once, plainly.」停止族；R20无handles，不跑creator fallback|
|R25|`eden_get_connections(W,X_ITEM,include:[existing])`|canonicalItemId=X_ITEM,count0,connections=[]；不请求 semantic suggestions|
|R26|`eden_search_captures(W,limit:3)`|list，count0,captures=[]|
|R27|`eden_search_highlights(W,limit:3)`|list，count0,highlights=[]|
|R28|`eden_get_brand_list_ads(W)`|status:roster,lists=[]；独立brand list空；不调可能添加新brand的 get_brand_ads|
|R29|`eden_list_stores({})`|stores=[]，W位于workspacesWithoutStore；R15初始化空壳不代表已建立store|
|R30|`eden_read_custom_ai_knowledge(W,AI,SOURCE_START,offset:0,maxChars:1200)`|totalChars3660,hasMore=true,nextOffset1200；验证heading/bold/link/image markdown与分页，不继续取全文|

### 错误/授权/副作用

- 本阶段无 auth-expired、401、-32001 或 OAuth authorization required；没有授权重试。若出现该错误，停止所有同凭据调用，不能换工具或直接HTTP绕过。
- R21/22的402被服务包装为status:error；UI应保留Upgrade状态，不显示「重试即可恢复」。R24有明确upgrade-required。
- 没有analyze_creator/get_brand_ads/refresh/live transcript/study/ask_custom_ai，没有触发新creator/brand上游拉取。
- R18返回planner=null和创建提示，未看到历史计划迁移生成。R24在套餐门槛退出；R20无connected account，未看到Analytics激活。read工具也不应盲当无副作用健康检查。

## 4. 最少脱敏 seed 与可支持的界面状态

### Library / Board

- 用本地身份「YG workspace」，owner，1member；不复制实际邮箱、工作区名、UUID、storagePath。
- 私有板「Eden 机制逆向 / 研究样本」，2 social cards，无sections。
- IG card：短题「Content ideas system」，约106k views/5.9k likes，8.74x outlier，注释摘要「命令式hook+三桶内容方法」。公开来源：https://www.instagram.com/reel/De9VLdqiNnL/ 。
- X card：短题「Build a content system with agents」，约17.5k views/172likes/14shares，14.33x outlier；注释摘要「scout→question→knowledge→writer/editor→visuals→feedback」。公开来源：https://x.com/AIGuide_/status/2111645720050651605 。
- saved card metrics只是该卡内容，不用于推断全索引最优榜。无doc/table对象，只能用真实空态；不得把Course的plan stub当workspace table。

### Skills / AI / Knowledge

- builtin共21：skill-creator、routine-creator、prompt-creator、text-posts、x-threads、linkedin-posts、instagram-captions、newsletter-writer、post-ideas、content-planner、grow-on-platform、study-a-creator、youtube-script、short-video-script、instagram-carousel、email-subject-lines、humanizer、table-builder、product-builder、community-builder、client-setup。
- reference文件数：linkedin-posts1、humanizer1、product-builder7、community-builder4；仅计数，不声称已从MCP取到文件正文。
- AI卡：Course/flag/gradient-graphite、managed/read-only、guided、33sources、4starter。可用本地短样例「今天哪一步」「缩小卡住的步骤」「改进开头」「落后如何继续」，不复制全套教学内容。
- 知识目录可种标题/文件名/字节数/access/readable；Start here、Day1…30、plan/resource。正文支持Markdown图片/链接与分页；本次只读1200chars。

### Plan / Publish / Automation / Store

- Strategy空态；Plan五列均0，planner未建。
- Publish默认Asia/Shanghai三slot、0accounts；1既存draft，可用本地短文案「系统决定动作，意志力负责开始」，无publish时间。target pending不等于已排期。
- routines0/20；follows/creator lists/brand lists/captures/highlights/tags空。
- Analytics升级态；Auto-DM/DMFlows Pro-Max升级态，不伪装空列表。
- Store onboarding：handle未选、Stripe未连、0product、无creatorPage；connections Unknown需展示未知态。
- MCP对象不能证明像素高保真，布局/字体/截图由网页取证线验证。

## 5. 未验证边界

|族|边界与原因|
|---|---|
|Documents/Tables|已实际搜索确认无对象；get_note_markdown/read_table未调用，不虚构ID|
|Saved media|无image/video/audio/pdf item，read_media_card未调用|
|Discover search/creator/study|已检查rosters及saved payload；不为覆盖调用新creator或高成本研究；search/read/study schema有登记但不等于runtime通过|
|Custom AI ask/get_answer|ask会创建chat且收费，不为覆盖运行；没有本轮messageId，不猜历史值|
|Skill bundled files|本会话没有单独读取文件工具；list/get只证明计数与skillMd；不通过AI聊天取文件|
|Builder/Eve/voice|没有创建AI、写声线或记忆任务，不执行持久写入|
|Analytics post rows|R24后停止族，不绕套餐门槛|
|Auto-DM/Flow详情|R21/22后停止族，无ruleId/flowId|
|Store product/customer/cohort|R29无store，R15无product/bundle/sellable ID；不拿购入managedAI冒充卖方商品|
|Store其他业务读入口|若有必要再做availability read并补回执；不得创建对象补覆盖|
|Resource/prompts|仅工具面已用，未用不存在note/table URI假读|
|网页外观|没有DOM/screenshot证据，不能用API推断尺寸/交互|

## 6. 静态 schema 登记（非执行回执）

以下取自本会话实际提供的tool input schema，全部变更工具未调用。workspaceId可default，但实测均显式W。此表用于复刻动作边界，不表示账号有权限。

### Workspace / 读写 / 保存

|工具|关键输入与限制|
|---|---|
|list_workspaces / list_tags / list_chats|前者无参数，后两者workspace|
|list_workspace_items|type/parentId/limit1–500/cursor；必须检查nextCursor|
|search_workspace_items|q匹配title+URL，type/parentId/limit≤100/cursor|
|find_workspace_items|query必填，limit≤25，kind/source/category/AI tags/userTags；semantic有费，未调|
|read_board|itemId，可board URL；get_note_markdown/read_table/read_media_card均itemId|
|get_connections|itemId，include existing/suggested、suggestionLimit≤10|
|create_board / rename_board / trash_board / reorder_board|title/folder；boardId+name；boardId；boardId+itemIds≤500|
|create_note|document/card、Library/board destination、section，content≤200k/card≤20k|
|rename_note|itemId+title|
|patch_note|itemId+baseContentHash64hex+edits1–50(oldText/newText)，可clientMutationId|
|update_note / append_to_note|完整content+baseContentHash/allowShrink；append仅新增content且非幂等|
|create_table|title+columns1–30、typed rows≤100、view、board/section/embed/replace passage|
|add_table_rows / update_table_rows|itemId+rows≤100；itemId+updates≤100，row/expectedRev/cells/done/repeat/removed|
|update_table|itemId、title/addColumns/view；table/list/board/calendar、groupBy、filters/hiddenColumns/saved views|
|connect_items / set_item_note / update_item_tags / trash_item|sourceIds≤20+targetId；itemId+userNote≤2k；itemId+add/remove；itemId UUID|
|search_captures / search_highlights|q可省读最近；limit/offset，status或source/orderBy|
|save_items_to_board|boardId+itemIds≤25+section|
|save_posts_to_board / library|posts≤20(platform/contentId/userNote)，前者boardId+section|
|save_ads_to_board|boardId+adIds≤12|
|save_links_to_board|boardId+urls≤40，url/userNote/section；可能重复创建|
|add_media_to_board|boardId，url/uploadSessionId/base64三选一；image/PDF≤25MB、chunk|
|prepare_board_media_upload|boardId+mimeType+exact sizeBytes，后续PUT再place|
|import_scheduling_media|url或chat file，下载并host；未执行|
|upload_scheduling_media|mimeType+base64，fileName/alt/chunk，≤25MB|
|prepare_scheduling_media_upload / scheduling_media_multipart|mimeType+sizeBytes≤10GB；step sign-part/complete/abort+storagePath/uploadId，partNumber或parts|

### Discover

|工具|关键输入|
|---|---|
|following_overview / analyze_list|platform/limit≤500；query/listRef可省为roster|
|resolve_creator / analyze_creator|query、platform；query+可creatorRef/since/topPostLimit/focus/refresh。首次可能拉取，未调|
|search_creators|kind topic/similar-to-creators/similar-to-list，对应query/creatorRefs/listId；platforms/follower bounds/limit≤25|
|search_social_content|scope必填，creator/list需ref；query/depth/orderBy/since/limit；creator分页及日期，Discover follower/outlier/language过滤有模式限制|
|read_social_post|url或contentId+platform二选一，includeTranscript/attemptLiveFetch可false|
|study_top_titles / study_top_carousels|creator或niche；前者youtube/substack/twitter标题，后者IG轮播；有费研究未调|
|search_ads / get_brand_ads / get_brand_list_ads|query/category/angle/platform/mediaType/runDays等；brand+page可能添加广告主；list可省roster|
|save_creators_to_list|listName或listId+links≤50，handlePlatform/preview|
|save_brands_to_list / remove_brands_from_list|listName+brands≤20；前者可创建，后者仅删membership。均未执行|

### Skills / AI / Eve

|工具|关键输入|
|---|---|
|list_skills / get_skill / export_skill / import_skill|workspace；skillId；skillId→skillMd+slug；完整skillMarkdown写入未执行|
|list_custom_ai / get_custom_ai|workspace；customAIId|
|search_custom_ai_knowledge / read_custom_ai_knowledge|customAIId，query可省、documentOffset；customAIId+sourceId、offset/maxChars≤100k|
|get_custom_ai_builder_guide|variant custom_ai/voice，static，未调|
|ask_custom_ai / get_custom_ai_answer|message、AI/chatId/mode；chatId+可messageId；ask是真实chat写入收费，未调|
|create_custom_ai|definition(name等)+sources+visibility，未调|
|update_custom_ai / manage_custom_ai_sources / delete_custom_ai|customAIId+expectedRevision+full definition；action add/update/remove+source/sourceId；confirmed:true。managed不能改|
|get_my_context|可format+topic；未按研究无关需求取个资|
|remember / learn_my_voice / save_to_knowledge|name/add/remove；samples/handles/libraryItemIds/notes/refresh；action save/add/remove+itemId/title/content/kind。均持久写未调|

### Strategy / Publish / Automation

|工具|关键输入|
|---|---|
|get_strategy / update_strategy|可pillar；changes≤20的op union。加/改pillar可研究收费，未调|
|get_plan / update_plan|filter/date/archived/planner；action add/update+items/updates≤20、card真实ID，未写|
|list_schedules / list_scheduled_posts|workspace；postId/scheduleId/status/signOff/mode/limit|
|connect_social_accounts|action status/get-link/sync，仅status实测|
|schedule_post / publish_post_now|text/segments/media/perPlatform/article、platforms/accounts；前者draft或concrete timestamp，timezone/idempotencyKey/planCardId；均未写|
|update_scheduled_post / cancel_scheduled_post|postId+patch；postId；均未写|
|schedule_drafts / update_schedule|scheduleId+drafts(postId,scheduledFor)；slots全替换/timezone；未写|
|list_routines / create_routine / update_routine|AI/target过滤；title/prompt/frequency/hour/timezone及day；routineId+变更/remove；只list|
|list_auto_dm_rules / list_dm_flows|workspace；可flowId/conversationId/peopleLimit|
|create_auto_dm_automation / update_auto_dm_automation / delete_auto_dm_automation|trigger/keyword/message/destination/postScope需真实用户输入；ruleId+patch；ruleId+preview/confirm；全未写|
|manage_dm_flows|draft/create/update/delete/test/pause/resume/stop_person，definition/flowId/ruleIds/transcript；均未调|
|search_instagram_music|query必填、brandId/limit；无IG连接不调|
|get_analytics / list_analytics_posts|days/brandId；days/platform/contentType/sort/limit≤100；首个升级后停止|

### Store / Commerce

|工具|读与写边界|
|---|---|
|list_stores / get_seller_overview|无参数；workspace；已实测|
|get_custom_ai_product / get_bundle / list_customers / get_customer|customAIId；bundleId；filter/page；email。需真实可售/客户对象，不调用伪造ID|
|save_custom_ai_product / save_bundle / publish_custom_ai_product|customAIId+price/billing/page/checkout/offer等patch；bundleId可省创建；AI或bundle+publish/unpublish+confirm。全部未写|
|organize_custom_ai_knowledge / update_creator_page|AI+shape/sections/place/sources/access；header/blocks/order；未写|
|manage_customer_access / import_customers / import_product_reviews|accessId+email/revoke/restore/move；product+customers→batch confirm/sendEmails；product/source/reviews/dryRun。未调|
|manage_cohorts|list/roster为读，需product/cohort；enable/create/update/delete/move为写|
|manage_coaching|读get/list_applications/list_clients/get_client；其余setup/decision/call/share写|
|manage_calendar|读get/list_calls/list_events；hours/call/event变更写|
|manage_content_links|list/suggest读或草案；create/update/archive/restore写|
|manage_sales|list读；create/update/end预览确认后改价格|
|manage_affiliates|overview/applications/payouts读；invite/decision/program/affiliate变更写|
|manage_forms|list/get/results/applications/coaching_forms读；create/update/publish/close/delete/attach/decision/reviewEmails写|
|manage_store_emails|overview/list/get读；sequence/broadcast/automation/newsletter/contact变更或外发未调；send_test也不执行|
|manage_lesson_questions / manage_ask_me|list；get/list为读，其余answer/decision/enable等写|
|manage_community|list/get/overview/members与各list/moderation_queue读，其他触达/setup写|
|manage_community_content|list/read/catch_up/unanswered/search读，send/pin/create/update/delete/reply/event变化写|

以上工具名均前缀 `eden_`。Deprecated stubs不调用：create_scheduling_draft→schedule_post(draft:true)，create_sticky_note→create_note(card)，read_card→read_social_post(url)。

## 7. 完成结论

本轮停在30次真实只读调用：27成功、3门槛失败；未启动后台作业、未作任何Eden变更。已覆盖工作区、板、Library、技能、CustomAI、managed知识、Strategy、Plan、Publish、连接、Routine、Discover rosters、capture/highlight/tag/graph、Store入口及Analytics/Auto-DM门槛。

不再追加无store/无对象的深读、全索引付费搜索或重复空态调用。文档/表/商店业务对象缺失与套餐拦截都已明确登记；不把未验证工具算成功，也不制造账号数据补覆盖。按族实际巡检完成，变更工具保持静态schema登记。

### 自评（已加载 agent-self-evaluation）

|轴|分数|证据 / 可改进处|
|---|---|---|
|准确性|4/5|R01–R30均对应真实回执；保留store空壳与无store、402的status:error等反例；未验证网页像素|
|完整性|4/5|目标工具族均有实测或明确无对象/门槛理由；note/table及store业务深读仍无对象验证|
|清晰度|4/5|执行台账、seed、缺口、静态schema分离；缩写参数不是可直接粘贴的完整JSON|
|可执行性|4/5|真实ID来源与脱敏seed可用于本地复刻；未生成机器可读fixture，避免超出唯一写文件边界|
|精简度|4/5|只保留30次必要回执摘要，不存课程/聊天全文；静态工具矩阵较长，但承担全族边界登记|

均分4.0/5。优先改进：有真实note/table/store对象后再补只读深测；原站截图由网页取证任务核验，不用MCP字段冒充像素证据。此评价与用户要求的只读、最少脱敏、未验证显式登记一致。
