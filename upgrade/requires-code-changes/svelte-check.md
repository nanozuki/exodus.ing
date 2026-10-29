# svelte-check

- 当前版本：`^4.3.6`
- 目标版本：`^4.7.7`
- 版本来源：`UPGRADING_RECORD.md`。
- 调研日期：2026-10-28。
- 分类：**需要修改代码**。使用 TS7 时现有 check/check:watch 命令需要增加原生检查模式参数，并配合 TS6/TS7
  alias 布局；Kit3 的配置读取也需随迁移调整。

## 实际使用

`package.json` 的 check/check:watch 先 `svelte-kit sync`，再运行
`svelte-check --tsconfig ./tsconfig.json`，watch 追加
`--watch`。没有 --tsgo 或 --incremental。根配置继承
`.svelte-kit/tsconfig.json`，包含 Svelte/TS 和 checkJs。

## 相关变化

已阅读[官方 4.3.6→4.7.7 changelog](https://github.com/sveltejs/language-tools/blob/svelte-check%404.7.7/packages/svelte-check/CHANGELOG.md)。

| 版本             | 变化与项目动作                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.4.0            | 新增 --incremental/--tsgo 模式，修复 watcher 遇 Unix socket 崩溃；项目 `.direnv/pg.sock` 环境下的 watch 应验证                                                                           |
| 4.4.3/4、4.4.7/8 | 模板 ts-ignore、TS lang 属性识别、tsconfig 诊断、TS6 兼容、stdout/stderr 输出修复；可能改变现有检查结果/退出表现                                                                         |
| 4.5.0            | 支持新版 Svelte 模板语法和配置 ts/mts；snippet 内名为 slot 的 prop 处理修复；当前没有新模板声明，不需要改语法                                                                            |
| 4.6.0            | 支持从 vite.config.js/ts 读取 Svelte 配置，是 Kit 3 配置迁移所必需                                                                                                                       |
| 4.7.0            | 新增 --config、实验 native compiler API 支持；Vite ESM 加载和点前缀祖先目录的工作区发现修复                                                                                              |
| 4.7.3/4          | 支持 +error.svelte 的零配置 props，以及通过 npm alias 安装的 TS7 Stable                                                                                                                  |
| 4.7.6            | 识别 Kit 3 在顶层合并的配置，避免沿用旧 kit 嵌套结构                                                                                                                                     |
| 4.7.7            | 默认 include 与 tsc 对齐，符号链接 .svelte 包类型去重、现代 CSS 属性、script/style 起点判断修复；TS 编译器子进程失败时确保非零退出                                                       |
| 4.4.1→4.7.7      | native/incremental 模式持续修复别名、shim、references、NodeNext、无 include 文件收集、watch cache 忽略、HTML 类型与错误诊断；仅当本次采用新模式才直接触发，但 TS7 升级很可能需要走此路径 |

## TypeScript 7 是具体迁移约束

[目标时期官方 README](https://github.com/sveltejs/language-tools/blob/svelte-check%404.7.7/packages/svelte-check/README.md#typescript-7-supports)明确：TS7 需要
`--tsgo` 或 `--tsgo-experimental-api`，同时安装 TS6 与 TS7；官方示例以 TS6 作
`typescript`，通过 `@typescript/native` npm
alias 安装 TS7。README 的旧参数表仍提到 native-preview，与新版支持段落存在年代差异，应以 4.7.4 的 Stable
alias 修复和升级时实际 CLI 帮助交叉核实。

因此不能只把 `typescript`
改到 7.0.2 后保持现有检查命令并假设可用；实际升级要决定 TS6 兼容依赖和 native
compiler
alias 布局，同步 check/check:watch、check:e2e 的编译器入口。这只是后续实施事项，本轮不擅自修改清单目标或依赖。

[固定目标 4.7.7 的官方 npm 元数据](https://registry.npmjs.org/svelte-check/4.7.7)还声明
`typescript: ^5.0.0 || ^6.0.0`，不是直接支持 TypeScript 7 作为同名 peer。Kit
3.1.0 自身也声明 TypeScript
`^6.0.0`，因此双版本/alias 不仅是 CLI 选择，还必须满足这两个库的安装约束。该元数据 Node
engines 为
`>=18.0.0`；README 中旧 Node16 文案不能覆盖正式发布元数据，当前 Docker 满足真实下限。

## 官方迁移资料与验证

此版本区间没有单独的 breaking migration
guide；上述官方 README 是 TS7 的迁移操作依据，Kit 配置迁移参见
[Kit 3 指南](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)。

升级后分别执行 check、check:e2e 和 watch 启动；确认文件覆盖范围、失败退出码及 Svelte/TS/JS/CSS 诊断均正常。本轮为文档审计，未执行目标版本验证。
