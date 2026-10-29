# vite

执行状态：本次目标升级已因配套版本不满足而回撤，等待对应迁移组；详见[版本约束记录](../version-constraints.md)。本文版本区间保留为调研目标。

- 当前版本：`^7.3.1`
- 目标版本：`^8.3.5`
- 版本来源：`UPGRADING_RECORD.md`。
- 调研日期：2026-10-28。
- 分类：**无需代码迁移（按当前调研）**。现有 build.sourcemap 和插件接入配置未命中删除 API；更新适配插件即可。Kit 配置迁入 Vite 的源码改动统一归 Kit3。

## 实际使用

`vite.config.ts`
集成 Tailwind、SvelteKit、unplugin-icons，开启 build.sourcemap，并承载 Vitest 的 client/server
projects。package scripts 使用 vite
dev/build/preview；没有自定义 Rollup 插件、manualChunks、JSX、decorators、library
mode 或显式 build.target/minify 配置。

## 相关变化清单

核查了[官方 8.0 迁移指南](https://vite.dev/guide/migration.html)、[官方 changelog 至 8.3.5](https://github.com/vitejs/vite/blob/v8.3.5/packages/vite/CHANGELOG.md)及[目标 package.json](https://github.com/vitejs/vite/blob/v8.3.5/packages/vite/package.json)。

7.x 维护线的后续发布不全包含在 8.x 主分支 changelog，因此额外核查[固定 7.3.7 tag 的官方 changelog](https://github.com/vitejs/vite/blob/v7.3.7/packages/vite/CHANGELOG.md)中 7.3.1 之后的全部条目：

- 7.3.2：优化依赖 sourcemap 路径遍历、env
  transport 的 server.fs 校验、去掉 query 后再次校验 server.fs 的修复；这些开发服务器入口在 8.0.5 也修复，目标 8.3.5 包含。当前未配置 --host/server.host，不能断言已暴露攻击条件，但不能遗漏相关修复。
- 7.3.3：新 Safari 不再不必要地降级解构语法；最终 8.x 转用 Oxc，也需按目标浏览器验证构建输出。
- 7.3.5：拒绝 Windows alternate paths 和 launch-editor
  middleware 的 UNC 路径；当前 macOS 开发没有直接平台迁移要求。7.3.4 在官方记录中注明跳过发布，不作为另一个需安装的版本。
- 7.3.6：允许 esbuild
  0.28，属于 7.x 依赖兼容；8.x 默认后端已经变化，不需要为了过渡单独升级 esbuild。
- 7.3.7：launch-editor 更新、transformIndexHtml
  filename 去掉 query、safeModulePaths 存 id 而非 URL；开发插件/文件访问路径相关，目标 8.3.3 已有对应修复。

以下为升级到 8.x 后的主要相关变化：

| 版本                           | 变化                                                                                                             | 本项目影响                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 8.0.0                          | bundler 与 dependency optimizer 改 Rolldown；JS/TS transform 与 JS minifier 改 Oxc                               | dev、SSR、build、Vitest 插件链均走新实现，需与 Kit 3/plugin 7/Vitest 5 协调；不因配置简单就归无变化         |
| 8.0.0                          | CSS minifier 默认改 Lightning CSS                                                                                | Tailwind 与组件 CSS 产物可能不同，检查实际页面样式与压缩后的 CSS                                            |
| 8.0.0                          | 默认浏览器目标提高：Chrome/Edge 107→111、Firefox 104→114、Safari 16.0→16.4                                       | 本项目未指定 target，默认支持范围真实变化；是否显式保留旧目标由后续升级决策决定                             |
| 8.0.0                          | CJS default import interop 更一致；移除 browser/module 字段的内容嗅探；external require 保持 require             | 影响间接依赖/SSR 打包解析；项目为 ESM，pg 等 Node 依赖应验证产物启动，不能仅看 tsc                          |
| 8.0.0                          | esbuild 变 optional；transformWithEsbuild 需要用户安装；旧 esbuild/rollupOptions 选项弃用或转接                  | 仓库没有对应直接 API/配置；检查插件目标版本适配 Oxc，不能为了兼容盲目添加旧工具                             |
| 8.0.3/5；8.1.0/1；8.2.2；8.3.1 | 非 ASCII sourcemap、优化依赖跟进变换的 sourcemap、配置 sourcemap 路径等修复；开发 sourcemap handler 路径限制加固 | 当前 build.sourcemap=true、开发和 Vitest 使用模块运行器，需验证实际错误栈/源码定位                          |
| 8.0.9                          | dotenv-expand 升级 v13                                                                                           | Vite 环境展开实现变化；当前 APP_URL 等多由进程环境供给，未发现复杂插值，但应验证 dev/build/preview 环境读取 |
| 8.3.2/4/5                      | watcher 错误恢复、服务器环境释放、连续重启、静态路径边界与优化器解析修复                                         | 现有开发服务器/HMR/依赖优化路径相关，属于修复收益；不表示已确认当前能重现缺陷                               |
| 8.3.4                          | preload helper 等待进行中的 stylesheet、CSS 循环 chunk 缓存修复                                                  | 路由跳转与动态加载样式应回归                                                                                |
| 8.3.5                          | CSS url 中字面 %、subpath imports 含多个 #、socket upgrade 错误处理修复                                          | 新 Kit 的 #lib 解析与 dev server 应验证；没有对应特殊输入的修复无需改业务                                   |

8.1→8.3 新增的 bundled-dev、chunkImportMap、自定义构建 API 等可选能力当前没有显式启用，不自动要求引入。UMD/IIFE
import.meta、system/amd 输出、手动分包、原生 decorator、插件 bundle 对象修改和插件 hook
API 的删除项未命中本仓库直接配置；仍需通过适配后的上游插件覆盖间接使用。

目标 Node engines 为 `^20.19.0 || >=22.12.0`，Docker 22.17.0 满足；Kit 3 的 Node
22.17 下限更严格。目标 Vite 的 @types/node
peer 也允许 >=22.12，清单目标 26.6.5 在其范围内，但 Node 类型与实际运行时对齐仍单独审查。

## 官方迁移指南与验证

[Migration from v7](https://vite.dev/guide/migration.html)是本次官方主指南，覆盖 Rolldown/Oxc、目标浏览器、CSS 压缩、CJS 和弃用配置；不需要先降级或额外引入 rolldown-vite 才能直接升级。

后续验证 dev/HMR、build、preview、Node
adapter 生产启动、浏览器/服务器 Vitest、E2E 与 source
map。升级审计没有执行这些目标版本测试。
