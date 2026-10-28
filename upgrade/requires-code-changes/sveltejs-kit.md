# @sveltejs/kit

- 当前版本：`^2.50.1`
- 目标版本：`^3.1.0`
- 版本来源：`UPGRADING_RECORD.md`，保持用户给定区间。
- 调研日期：2026-10-28。
- 分类：**需要修改代码**。需要把 Svelte 配置迁入 Vite，迁移 #lib/扩展名、tsconfig、类型导入、remote forms、刷新及重定向等现有代码。

## 实际使用

`svelte.config.js` 配置 Node adapter、remote functions 和 async 编译；`vite.config.ts` 调用 `sveltekit()`；根 `tsconfig.json` 继承 `.svelte-kit/tsconfig.json`。应用普遍使用 `$lib`、`$app/state`、`$app/server` 的 `query/form/getRequestEvent`；表单、查询刷新和身份验证覆盖多数页面。`src/hooks.server.ts` 导入 `Handle/ServerInit`，`src/lib/rune/FormState.svelte.ts`、`src/lib/component/Input*.svelte` 导入 remote 类型。

## 相关变更清单

以下按功能合并同类修复；引入版本来自[官方完整 changelog](https://github.com/sveltejs/kit/blob/%40sveltejs%2Fkit%403.1.0/packages/kit/CHANGELOG.md)，核查了 2.50.1 之后至 3.1.0 的稳定版，未将 next 版重复计算。

| 引入版本                                              | 变化                                                                                                                                                               | 本项目影响与动作                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.0.0                                                 | 不再读取 `svelte.config.js`，选项直接传给 Vite 的 `sveltekit({...})`，原 `kit` 层去掉                                                                              | 移动 adapter、preprocess、remoteFunctions、async 等配置；迁移后同步 Prettier、检查工具对配置的读取。2.62.0 已提供过渡入口                                                   |
| 3.0.0                                                 | `$lib` 被 `#lib` 替代，并采用 package imports；移除隐式扩展名支持                                                                                                  | 全项目别名迁移，按官方迁移器处理 `.js`/`.svelte` 等扩展名；不要仅做字符串替换                                                                                               |
| 3.0.0                                                 | 生成配置改为 `$app/tsconfig`，不再继承 `.svelte-kit/tsconfig.json`；用户提供 include/exclude                                                                       | 修改根配置，并复核继承它的 `e2e/tsconfig.json` 的文件集合；保留脚本、测试所需检查范围                                                                                       |
| 3.0.0                                                 | remote 类型移到 `$app/server`，hooks 类型移到 `@sveltejs/kit/hooks`                                                                                                | 调整 `RemoteForm/RemoteFormInput/RemoteFormIssue`、`Handle/ServerInit` 导入。不要把仍属于主入口的 `RequestEvent/Cookies/RequestHandler` 一并移动                            |
| 3.0.0                                                 | 所有 remote form 控件必须来自本表单的 `fields.foo.as(...)`；手写 name 提交会被拒绝                                                                                 | 命中 auth、profile、account、invite、bookmark、comment 和发布表单的手写 name/hidden/submit 控件；输入组件应透传 `.as()` 属性，含隐藏值、按钮值、默认值和 reset 行为都要迁移 |
| 2.57.0；2.61.0                                        | enhanced remote form 的 `submit()` 返回是否验证通过；enhance 回调新增 remote form 实例；表单支持程序化 submit                                                      | `FormState` 当前 await submit 后总是 afterSubmit/reset，应按新返回值检查验证失败时不能执行成功流程；区分回调中的 HTML form 与 remote form 实例                              |
| 2.59.0；3.0.0                                         | 服务端 refresh 的 promise 表示登记刷新；客户端 single-flight 刷新规则重做，服务器未履行请求的更新会报错                                                            | 核查 invites、bookmark、comments remotes 的 `.refresh()`，以及 FormState 与页面更新是否一致；不能用 await refresh 推断数据已执行完成                                        |
| 2.56.0；2.61.0；2.65.0/2.67.0                         | query 缓存按排序后的对象键稳定化，跨响应式/普通 await 共享缓存，可在更多上下文 await；去重修复；删除 query `.run()`                                                | 当前 `$derived(await ...)` 与重复 layout 查询会受缓存/去重变化影响；当前未发现 `.run()`，无需为该删除改代码                                                                 |
| 2.52.1；2.53.0/2.53.2；2.58.0；2.59.0；2.66.0；2.69.0 | 验证状态清理、pending 计数、嵌套值 SSR、重定向后 query 更新、默认值及表单 reset 修复                                                                               | 影响共享 FormState、错误展示、编辑表单的重置体验；不应把这些修复归入“无变化”                                                                                                |
| 2.65.2                                                | remote 响应强制 private/no-store；传输失败保留原 HTTP 状态和错误体；修复未处理 rejection                                                                           | 个性化用户/书签/权限查询缓存和 hooks 拒绝请求的错误表现改变，验证未登录与无权限场景                                                                                         |
| 3.0.0                                                 | query 中读取 event.url/params/route 会抛错                                                                                                                         | 项目约定已经显式传路由输入；逐个 getRequestEvent 使用核对，仅读取 locals/cookies 不受此限制                                                                                 |
| 3.0.0                                                 | 外部 redirect 默认禁止，需 external 选项或允许列表                                                                                                                 | `src/hooks.server.ts` 的 redirect(303, host) 在纠正外部 Host 时会命中；应为配置的可信 origin 明确授权。OAuth callback 手写 Response Location 不由这一 helper 自动保护       |
| 3.0.0                                                 | `page.url`/searchParams 类型只读；导航到当前 URL 会刷新全部 load/query                                                                                             | 当前页面只读 pathname/searchParams，未发现直接修改；仍应验证分页/重复点击链接、query 刷新行为                                                                               |
| 3.0.0                                                 | remote resource 的 error 收窄为 App.Error；渲染错误统一经过 handleError 和最近错误边界                                                                             | `src/routes/+error.svelte` 使用自定义 App.Error tag，需验证查询失败与 SSR 错误映射；当前没有自定义 handleError 不代表错误行为不变                                           |
| 3.0.0                                                 | error(status, object) 形式弃用，推荐 error(status, message, details)；错误 helper 使用公开类型                                                                     | 核查 `src/lib/errors.ts` 中构造 HTTP 错误的方式与 App.Error 结构；`isHttpError` 继续使用，未依赖 internal 类                                                                |
| 3.0.0                                                 | cookie v2；cookie 名只能 ASCII；path 默认 `/`，dev 中 secure 默认 false；更严格跨源表单处理                                                                        | 当前 auth cookie 显式 path/secure 的规则仍应保留；验证 OAuth、测试登录以及跨源提交，不能依赖旧默认行为                                                                      |
| 3.0.0                                                 | `ORIGIN` 环境变量被移除，改 paths.origin；server 文件/目录识别更一致                                                                                               | `e2e/support/fixtures.ts` 仍传 ORIGIN，需要与 adapter 报告一起迁移；应用 server 目录边界需要通过 build 检查                                                                 |
| 3.0.0                                                 | 生产错误栈应用 sourcemap；部署版本自动检查默认每小时、远程请求/导航/窗口聚焦也参与检查                                                                             | 当前开启 build.sourcemap，验证生产错误栈；当前无 updated UI，不需要新增，但网络行为变化应保留认知                                                                           |
| 2.52.2、2.53.3、2.70.0、3.0.0                         | 表单文件元数据校验、非 production NODE_ENV 构建的 CSRF 保护、跨源表单和重定向安全修复                                                                              | 项目暴露 remote form，即便没有文件上传，也会走相关解析入口；应保留安全收益并验证测试夹具的 origin                                                                           |
| 3.0.0；3.1.0 目标元数据                               | Node 最低 22.17；3.0 changelog 写 Svelte 最低 5.56.4，但 **3.1.0 实际 peer 是 Svelte `^5.57.1`、TypeScript `^6.0.0`、vite-plugin-svelte `^7.0.0`、Vite `^8.0.12`** | Docker Node 22.17.0 和目标 Svelte 5.57.3 满足；**清单 TypeScript 7.0.2 不满足 Kit 3.1.0 的 TypeScript peer**，不能将“要求 TS6”误读为任意 >=6                                |
| 3.0.1、3.1.0                                          | 生成类型相对导入、server-only 判断、生成文件无内容变动时不重写等修复                                                                                               | 当前 bundler 模块解析不直接命中 nodenext 修复；生成检查/HMR 流程受其他修复影响；3.1 新 CSP hash reporting 与 endpoint tracing 当前未配置，不必启用                          |

3.0.0 另修复 remote 字段值强制转换/初始默认值、单次刷新序列化、redirect 完成时机及失败 query 的 promise 清理；这些与现有 forms/queries 同一路径，合并在上述表单与刷新验证项中。query.live、prerender remote、service worker、参数 matcher、自定义 adapter、跨页面 use:enhance、shallow routing 相关 API 变化当前没有对应使用，不需要为了升级引入这些功能。`$app/stores` 已移除，但项目已使用 `$app/state`。

## 官方迁移指南与验证

[固定目标 3.1.0 的官方 npm 元数据](https://registry.npmjs.org/@sveltejs/kit/3.1.0)直接核实 engines/peerDependencies。TypeScript peer 虽标 optional，本项目已安装它，仍需满足范围；后续应保留 TypeScript 6 供 Kit/检查器使用，并评估用 npm alias 单独接入 TS7 编译器，见 svelte-check 报告。此处只记录冲突，不更改用户清单。

- [Migrating to SvelteKit v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)：包含配置、别名/扩展名、tsconfig、types、remote forms、环境与 adapter 迁移。
- [官方 3.0 发布说明及迁移器入口](https://svelte.dev/blog/sveltekit-3-is-here)：可在实际升级阶段运行 `sv migrate sveltekit-3`，随后逐项审查生成结果。本轮未运行。

升级阶段执行类型检查、生产构建、Node 产物启动、全部现有 E2E；重点验证登录/Host 重定向、表单错误不触发成功重置、隐藏字段/submit 值、文章发布/评论/书签刷新、无 JS 提交、SSR/hydration 与 origin。当前报告是静态影响审计，未安装目标依赖，未声称这些验证已通过。
