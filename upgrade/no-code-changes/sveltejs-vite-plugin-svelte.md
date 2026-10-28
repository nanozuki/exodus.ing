# @sveltejs/vite-plugin-svelte

执行状态：本次目标升级已因配套版本不满足而回撤，等待对应迁移组；详见[版本约束记录](../version-constraints.md)。本文版本区间保留为调研目标。

- 当前版本：`^6.2.4`
- 目标版本：`^7.3.1`
- 版本来源：`UPGRADING_RECORD.md`。
- 调研日期：2026-10-28。
- 分类：**无需代码迁移（按当前调研）**。现有 vitePreprocess 调用未命中删除 API；Svelte 配置文件位置的调整统一归 Kit3 迁移，不重复算作本插件独立迁移。

## 实际使用

`svelte.config.js` 的 `vitePreprocess()` 处理 Svelte TypeScript；`vite.config.ts` 通过 SvelteKit 插件接入。大量组件在模板中引用 script 导入，应用启用了 async、使用 scoped CSS、SSR 与 HMR。

## 变更清单

已核查[官方 6.2.4→7.3.1 changelog](https://github.com/sveltejs/vite-plugin-svelte/blob/%40sveltejs%2Fvite-plugin-svelte%407.3.1/packages/vite-plugin-svelte/CHANGELOG.md)。

该目标 tag 的记录里，6.x 最后一条就是基线 6.2.4；没有 6.2.4 之后的 6.x 发布条目可额外纳入。基线 6.2.4 已含的 HMR 乱序 CSS 修复不重复作为本次新增变化。

| 版本                      | 变化及影响                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 7.0.0                     | 要求 Vite 8、Svelte 至少 5.46.4；本项目当前 Svelte 满足插件自身下限，但 Kit 3 要求更高，应按 Kit 约束一起升级    |
| 7.0.0                     | 不再覆盖开发期 cssHash，使用 Svelte 自身稳定 hash；需验证开发/SSR CSS 与 HMR，不能依赖旧 hash 字符串             |
| 7.0.0                     | inspector 合并进主插件，依赖/开发工具集成方式变化；当前未单独配置 inspector，无需新增配置                        |
| 7.1.0                     | 开发期服务器环境也启用依赖优化，SSR 依赖解析/启动与重载路径变化                                                  |
| 7.1.1                     | vitePreprocess 向 Oxc 传 onlyRemoveTypeImports，避免仅在 Svelte 模板使用的值导入被误删；与本项目模板导入直接相关 |
| 7.1.1、7.1.2              | 修复 SSR 中优化过的 Svelte 依赖 CSS、带 Svelte 文件依赖的编译 CSS 解析；验证现有 UI 依赖 SSR 样式                |
| 7.3.0                     | 异常配置选项不再把完整 inline config 写进日志；环境参数传入 dynamicCompileOptions 属新增能力，当前没使用         |
| 7.2.0、7.1.3/7.1.4、7.3.1 | inspector 新上下文菜单及 Vite+/pnpm 注入、LTR 样式修复；当前并非 Vite+，不需要针对这些功能改应用                 |

7.0 删除 deprecated `vitePlugin.hot`、`vitePlugin.ignorePluginPreprocessors`、插件 `api.idFilter`、其他插件的 `plugin.api.sveltePreprocess`。仓库未发现这些配置/API，不能因为主版本变化就假设本项目必须迁移它们。

## 官方迁移信息

未发现专门的 v7 migration 文档；[官方 7.0.0 发布记录](https://github.com/sveltejs/vite-plugin-svelte/releases/tag/%40sveltejs%2Fvite-plugin-svelte%407.0.0)直接列出删除项与替代 API；[官方高级用法](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/advanced-usage.md#transform-svelte-files-with-vite-plugins)解释 preprocess 插件接口。[Vite 8 迁移指南](https://vite.dev/guide/migration.html)覆盖 Oxc/Rolldown 的上游迁移。

在实际升级阶段运行类型检查、开发 HMR、生产 SSR build、客户端浏览器测试；确认模板值导入和 CSS 正常。本轮未执行目标版本验证。
