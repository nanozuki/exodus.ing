# @vitest/browser-playwright

执行状态：2026-10-28 已完成目标升级，实际安装版本为 5.0.5；browser-svelte 已配套升级为 3.1.0，详见[版本约束记录](../version-constraints.md)。本文保留原调研区间及迁移依据。

- 调研日期：2026-10-28。
- 清单当前版本：`^4.0.18`；清单目标版本：`^5.0.5`。固定比较区间：`4.0.18 < version <= 5.0.5`。
- 分类：**无需代码迁移（按当前调研）**。现有 provider 配置和内置 locator 调用保留；配套 Vitest5 即可，render 调整由 vitest-browser-svelte 记录。

## 项目用法

`vite.config.ts:1` 导入 playwright provider，在 client project 使用 `provider: playwright()`、`instances: [{ browser: 'chromium', headless: true }]`。`Dialog.svelte.test.ts` 通过 browser-svelte render 得到 locator，调用 click/fill，再执行 expect.element。没有自定义 provider、commands、connectOptions、trace 配置。

## 使用范围内的变更

此包在 Vitest monorepo 随主版本发布，官方没有另一个独立的 provider changelog。以下从官方逐版本发布记录筛选 Browser Mode / Playwright 项，而不是仅凭主版本号推断。

| 引入版本      | 官方变化                                                                                                               | 本项目影响                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1.0         | Browser failure screenshot 改用 artifacts API，增加 tracing 支持等。                                                   | 失败产物/调试输出变化；新增 trace API 当前未显式使用。见 [4.1.0](https://github.com/vitest-dev/vitest/releases/tag/v4.1.0)。                                                                        |
| 4.1.1         | 修复 Playwright provider event listener 泄漏。                                                                         | Chromium 运行与关闭生命周期直接相关。见 [4.1.1](https://github.com/vitest-dev/vitest/releases/tag/v4.1.1)。                                                                                         |
| 5.0.0         | locator 序列化从 string 改为对象；browser locators.exact 默认 true；修复 locator 正超时、预热浏览器与服务器关闭顺序。  | 项目使用内置 locator，不能自行依赖旧序列化；当前 name 是完整标签，仍需确认精确匹配。见 [5.0.0](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0)。                                          |
| 5.0.3 / 5.0.4 | 延迟 browser server listen、修复取消时 crash 与 browser mock 路由拦截竞态。                                            | Browser Mode 启动/取消和 mock 功能更可靠，无新增配置迁移。见 [5.0.3](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3)、[5.0.4](https://github.com/vitest-dev/vitest/releases/tag/v5.0.4)。 |
| 5.0.5         | synthetic pagehide 不再错误终止测试；启动时调用 plugin buildStart；丢弃已关闭 session 的迟到连接；关闭浏览器等待30秒。 | Svelte/Vite 插件初始化、导航事件和浏览器退出都在实际使用路径。见 [5.0.5](https://github.com/vitest-dev/vitest/releases/tag/v5.0.5)。                                                                |

已覆盖官方4.1.0–4.1.12、5.0.0–5.0.5记录中相关 provider/browser 项。未用的 remote connection、WebKit、coverage/screenshot 比对 API 不列为必须迁移。

[目标官方包元数据](https://registry.npmjs.org/@vitest/browser-playwright/5.0.5) 要求 `vitest: 5.0.5` 和 `playwright: *` peer；不把这里的通配 peer 当成所有浏览器版本都已验证兼容。运行 Node/Vite 下限继承 Vitest5 的要求，见 [Vitest记录](vitest.md)。

## 官方迁移指南与验证

使用 monorepo 的 [Vitest5官方迁移指南](https://vitest.dev/guide/migration/)，重点是 locator strict default、SerializedLocator、browser session、artifact目录和配置继承。未找到本 provider 的独立迁移指南。

本项目未自定义 browser command，因此不需自己解构 SerializedLocator；也不应为“兼容”直接关闭精确匹配。目标版本已安装，browser-svelte3 已迁移为 await render。Chromium Dialog 测试验证了挂载、焦点、fill/click和正常退出；全部41项 Vitest 测试通过，无需修改 provider 配置。
