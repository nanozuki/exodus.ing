# typescript

- 调研日期：2026-10-28。
- 清单当前版本：`^5.9.3`；清单目标版本：`^7.0.2`。固定比较区间：`5.9.3 < version <= 7.0.2`，包含 TypeScript 6 的过渡变化。
- 分类：**需要修改代码**。现有工具依赖旧 Compiler API，目标 TS7 不能直接替换同名依赖；需要设计 TS6/TS7 共存布局并调整检查脚本/编译器入口及有效 tsconfig。

## 项目用法

`package.json` 的 check 运行 svelte-check，check:e2e 运行 tsc；ESLint 使用 typescript-eslint。根 tsconfig 启用 allowJs/checkJs/strict/esModuleInterop、bundler resolution，extends 由 SvelteKit 生成的 tsconfig；e2e/tsconfig 继承根配置并 include 根目录 playwright.config.ts 和 src/app.d.ts。flake 安装 vtsls 和 svelte-language-server。

## 相关变更与行动

| 引入版本             | 官方变化                                                                                                              | 对本项目的影响                                                                                                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.0，7.0 延续        | rootDir 默认改为 tsconfig 所在目录；types 默认为空；noUncheckedSideEffectImports 默认 true；DOM iterable 合并进 dom。 | 核查生成与继承后的有效配置。根 types 已显式设为 unplugin-icons，不是依赖旧的“自动包含全部 @types”默认；但 Node 全局仍需显式保证可见。e2e include 根目录外文件，必须特别检查新的 rootDir 诊断。CSS side-effect import 需要有效声明。                                                                                        |
| 6.0 弃用、7.0 硬错误 | 移除 baseUrl、node10/classic resolution、ES5/downlevelIteration 等；esModuleInterop 不能 false。                      | 本地 bundler resolution、strict:true、esModuleInterop:true 已符合方向；仍需检查 SvelteKit 生成配置是否残留 baseUrl 或其他被移除项。不能仅看手写 tsconfig。                                                                                                                                                                 |
| 7.0                  | tsc 改为原生编译器；旧稳定 JavaScript Compiler API 不再随根入口提供。                                                 | `typescript-eslint` 与 Svelte 检查工具不能自动沿用旧 Compiler API。已核对目标 typescript-eslint 8.72.1 的 peer 为 `>=4.8.4 <6.1.0`，**排除7.0.2**，需解决依赖方案后升级。目标 SvelteKit3.1.0 的 optional TypeScript peer 是 `^6.0.0`；本项目显式安装 TypeScript，7.0.2同样不满足该peer。vtsls 的旧 tsserver 接入也需另核。 |
| 7.0                  | checkJs/JSDoc 分析与 TS 规则更一致；类型排序稳定化；模板字符串类型按 Unicode code point 推断。                        | checkJs 覆盖的 JS 配置需要重新检查；项目没有发现依赖 UTF-16 模板类型拆分的实现。类型错误变化不能预先当成运行时缺陷。                                                                                                                                                                                                       |
| 7.0.2 目标发布包     | `tsc` 二进制通过平台 optionalDependencies 提供；根 exports 为版本信息，另有 `unstable/*` 接口。                       | Nix 开发机、Docker 架构的安装需要能解析对应 native 包；unstable 接口不等价于旧 Compiler API。                                                                                                                                                                                                                              |

官方依据：[6.0 发布与 breaking/deprecations](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)、[7.0 发布与迁移说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)、[7.0.2 官方发布](https://github.com/microsoft/TypeScript/releases/tag/v7.0.2)、[目标包元数据](https://registry.npmjs.org/typescript/7.0.2)、[typescript-eslint8.72.1 元数据](https://registry.npmjs.org/typescript-eslint/8.72.1)、[Kit3.1.0 元数据](https://registry.npmjs.org/@sveltejs/kit/3.1.0)。7.0.2 release 直接链接 7.0 公告，没有独立逐项补丁 changelog；为核查目标实际打包接口，额外读取其官方发布包 package.json 的 exports/bin/optionalDependencies，而不根据未发布的未来接口推测。

## 官方迁移指南

官方 [7.0 公告的 Running Side-by-Side with TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0) 提供迁移路径：让需要旧 API 的工具通过 npm alias 使用 `@typescript/typescript6`，另装 TS7 运行原生 tsc。官方没有另一本独立的 5.9→7.0 迁移手册；应结合 6.0 公告的 Breaking Changes and Deprecations 与 7.0 公告的迁移章节。

Svelte检查还需配套调整：官方 [svelte-check README](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md) 说明 TS7 需 `--tsgo` 或 `--tsgo-experimental-api`，并同时安装 TS6 / TS7；目标4.7.7支持情况见 [svelte-check报告](svelte-check.md)。当前 check 脚本没有这些 flag，不能只替换 typescript 依赖。

建议先决定如何同时满足 TS7 CLI 与 typescript-eslint/Svelte 工具的旧 API，再针对有效 tsconfig 逐条迁移。双安装是官方方案，是否适合本仓库仍需结合 svelte-check 的记录决定，本轮不擅自增加新依赖。

验证需包含 `pnpm check`、`pnpm check:e2e`、直接运行 ESLint（不要使用会写文件的 lint 脚本做只读验证）、构建和脚本测试。尚未安装目标版本，因此当前只确认兼容约束，不宣称完成可运行迁移。
