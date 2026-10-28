# vitest

执行状态：2026-10-28 已完成目标升级，实际安装版本为 5.0.5；browser-svelte 已配套升级为 3.1.0，详见[版本约束记录](../version-constraints.md)。本文保留原调研区间及迁移依据。

- 调研日期：2026-10-28。
- 清单当前版本：`^4.0.18`；清单目标版本：`^5.0.5`。固定比较区间：`4.0.18 < version <= 5.0.5`。
- 分类：**无需代码迁移（按当前调研）**。现有 mock 清理、顶层 hoisted、await 断言和完整 locator 名称未发现必须改写项；配置继承及默认行为变化保留为回归项。

## 项目用法

`vite.config.ts` 使用 test.projects，两个 inline project 都 extends 同一个 vite.config.ts。client 是 Playwright Chromium，server 是 node；设置 requireAssertions、testTimeout、hookTimeout。测试使用 vi.hoisted/mock/fn/resetAllMocks、fake Date、异步 rejects/resolves、expect.element。`Dialog.svelte.test.ts` 使用 browser locator。server 的 remotes/auth/OAuth 测试已主动清理 mock。无 coverage、bench、自定义 reporter/custom browser command 配置。

## 命中使用范围的变更

| 引入版本      | 变更与官方依据                                                                                                                                                                                                                          | 项目影响                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1.0         | 更新 fake timers；改进 mock/Browser Mode；支持 Vite8。见 [4.1.0](https://github.com/vitest-dev/vitest/releases/tag/v4.1.0)。                                                                                                            | Date-only fake timers 的依赖实现更新；目标 Vite8 应与新测试链一起验证。未使用新增 around hooks/tag 等 API。                                                |
| 4.1.1 / 4.1.2 | 修复 external mocked module 重求值和 mock/unmock 顺序。见 [4.1.1](https://github.com/vitest-dev/vitest/releases/tag/v4.1.1)、[4.1.2](https://github.com/vitest-dev/vitest/releases/tag/v4.1.2)。                                        | 服务端已有 factory mock/importOriginal；虽然接口不变，执行正确性修复属于已用功能的行为变化。                                                               |
| 5.0.0         | **clearMocks 默认 true**；inline projects 默认继承根配置并可共享 Vite server；未 await 的 async assertion 变为失败；hoisted 调用必须在顶层。见 [5.0.0](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0)。                      | 全局 mock 调用历史生命周期变化；当前主要 mock 文件已有清理，仍须回归。现有顶层 hoisted/mock 符合规则。两项目的自引用 extends 要核对插件实例/配置执行次数。 |
| 5.0.0         | Browser locator 默认精确匹配；断言 `toHaveTextContent` 改为严格相等；失败截图目录变化。见 [官方迁移指南](https://vitest.dev/guide/migration/)。                                                                                         | Dialog 使用 getByRole(name)；现有名字看起来是完整匹配，仍需执行确认。未使用 toHaveTextContent 或自定义 screenshot 路径，因此无需为这两项改断言。           |
| 5.0.1         | 修复 self-referencing extends 服务器共享、强制 queueMicrotask/nextTick 不被 fake。见 [5.0.1](https://github.com/vitest-dev/vitest/releases/tag/v5.0.1)。                                                                                | 与当前同配置 extends 及 fake Date 相关。目标5.0.5已包含，不要只依据5.0.0判断共享行为。                                                                     |
| 5.0.2         | 修复 toMatchObject 与 asymmetric matcher。见 [5.0.2](https://github.com/vitest-dev/vitest/releases/tag/v5.0.2)。                                                                                                                        | auth 测试使用 toMatchObject，属于使用范围内的正确性修复。                                                                                                  |
| 5.0.3 / 5.0.4 | 项目缓存隔离、缓存依赖重验证；默认 fsModuleCache；修复 project root、browser mock route race。见 [5.0.3](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3)、[5.0.4](https://github.com/vitest-dev/vitest/releases/tag/v5.0.4)。 | 多项目转换/缓存行为变化，首次和重复运行都要验证；不是应用 API 改写要求。                                                                                   |
| 5.0.5         | 修复后续 hook 失败时清理、释放已结束文件的 mocks、browser buildStart/连接/关闭生命周期；保留 Vite默认 fs.deny。见 [5.0.5](https://github.com/vitest-dev/vitest/releases/tag/v5.0.5)。                                                   | 数据库清理与浏览器测试退出行为相关；需确认失败路径也会释放资源。                                                                                           |

已读取官方 releases 中区间的 4.1.0–4.1.12 与 5.0.0–5.0.5 正式记录，表格按本项目使用面筛选；其余 patch 的 CLI、coverage、UI、snapshot 等修复没有对应配置/调用，不逐条复制。

## 运行要求与未命中 breaking

[5.0.5 官方包元数据](https://registry.npmjs.org/vitest/5.0.5)：Node 为 `^22.12.0 || ^24.0.0 || >=26.0.0`；Vite peer 为 `^6.4.0 || ^7.0.0 || ^8.0.0`。Docker22.17满足 Vitest 本身要求，但不满足 jsdom30，见相应记录。browser-playwright 必须与 Vitest 同为5.0.5。

移除 deprecated entrypoints、sequential/benchmark API，coverage glob/threshold 与 reporter 默认输出调整，在当前仓库未发现对应使用。toThrow 空字符串、类 mock prototype 修复也未发现对应调用，不要求盲改代码。Vitest 的 expect.poll 与 Playwright Test 的 expect.poll 是不同实现，后者不受此条直接影响。

## 官方迁移指南与验证

[官方 Migrating to Vitest 5.0](https://vitest.dev/guide/migration/) 是本区间的专门迁移指南。已完成 browser-svelte 的 await render 迁移；`pnpm test:unit --run --project client` 和 `pnpm test:unit --run` 均通过，全部41项测试覆盖 client/server 项目发现、SvelteKit 插件、mock、数据库及 fake Date 的现有用法，测试进程正常退出，配置无需修改。
