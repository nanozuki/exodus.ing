# TypeScript 7 是否值得采用

调研日期：2026-10-31。当前项目使用 TypeScript
6.0.3；本轮只在临时目录安装 7.0.2 做对比，未修改项目的 TypeScript 依赖和检查脚本。

## 建议

目前继续使用 TS6。TS7 有真实的性能收益，但本项目检查本身只需数秒，尚无检查等待过长的证据；额外维护两个编译器、原生检查模式和编辑器兼容路径的成本暂时更明显。

TS6 迁移已经完成，不应再把它和原清单中的 TS7 目标视为同一项未完成工作。

## 收益落在哪里

[官方 TS7 发布说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)的主要收益是原生编译器、多线程检查和语言服务性能。官方大型仓库全量编译示例约快 8–12 倍，内存示例下降 6–26%；这些是特定项目的结果，不是本仓库的性能保证。TS7 也重写了 watch 机制。

本项目的 build 调用 Vite，使用 Rolldown/Oxc 的构建链，不调用 tsc 做类型检查。因此，增加 TS7 主要加速 check、check:e2e 或另行切换的编辑器语言服务，不会按编译器倍数加快生产打包、数据库测试、浏览器测试或线上页面。这个判断来自 package.json、vite.config.ts 和 CI 配置。

本项目没有发现必须依赖 TS7 才能表达的业务类型或语言功能；升级动机主要是缩短反馈时间。

## 当前工具链的具体成本

- Kit 3.1.0 的 TypeScript peer 为 ^6.0.0，svelte-check 4.7.7 为 ^5.0.0 ||
  ^6.0.0，typescript-eslint 8.72.1 为 >=4.8.4
  <6.1.0。以上均核对本地安装包与锁文件，直接替换同名 typescript 会破坏这套组合。
- [svelte-check 4.7.7 的说明](https://github.com/sveltejs/language-tools/blob/svelte-check%404.7.7/packages/svelte-check/README.md#typescript-7-supports)提供共存方案：保留 typescript@6，添加 @typescript/native@npm:typescript@7；应用检查需要 --tsgo 或 --tsgo-experimental-api。E2E 需要明确调用原生 alias 的 tsc，避免实际仍在运行 TS6。若采用，还应覆盖 check:watch 和 CI。
- 普通 --tsgo 路径沿用 incremental 模式的限制，包括 tsconfig 根目录外 Svelte 文件的覆盖限制。实验 API 模式在当前 CLI 帮助中明确警告可能无预告破坏兼容，不应把单次通过等同于后续版本稳定性。
- flake 安装的是 vtsls 和 svelte-language-server。[vtsls 文档](https://github.com/yioneko/vtsls#typescript-version)说明默认使用其自带 TypeScript，也可选择 workspace
  SDK。因此仅加入 TS7
  CLI 不能证明编辑器也获得相同收益；本轮未修改用户的编辑器配置，也未测量交互延迟。
- 原生编译器通过平台包分发，需要在 macOS 开发环境和 Linux
  CI/镜像上验证安装、检查和诊断一致性。本轮只测了本机 macOS，不代表 Linux 已验证。

官方 TS7 公告也区分了普通 TypeScript 语言服务与依赖嵌入式语言集成的 Svelte 工作流，后者不能直接套用普通 TS 的编辑器性能结论。

## 本项目实测

环境：本机 Nix shell，Node 24.21.0；TypeScript 6.0.3 / 7.0.2，svelte-check
4.7.7。使用现有 tsconfig、相同源码与 runed
0.38.0。同步生成配置后，直接调用检查器计时，不包含共同的 svelte-kit
sync、pnpm/Nix 启动和安装时间。

先分别试验普通原生模式和实验 API 模式。完整 E2E 结束后，再对能通过检查的实验 API 模式进行三轮对比，每轮依次运行应用 TS6、应用 TS7、E2E
TS6、E2E
TS7，取墙钟时间中位数。未清理系统文件缓存，也未测量峰值内存，不能当作冷启动或 CI 性能结果。

| 检查                                          | TS6      | TS7                                    | 结果                                  |
| --------------------------------------------- | -------- | -------------------------------------- | ------------------------------------- |
| 应用：svelte-check --tsconfig ./tsconfig.json | 2.492 秒 | 1.154 秒，追加 --tsgo-experimental-api | 均通过，约 2.2 倍，每次节省约 1.34 秒 |
| E2E：tsc --project e2e/tsconfig.json          | 0.914 秒 | 0.170 秒，调用原生 tsc                 | 均通过，约 5.4 倍，每次节省约 0.74 秒 |

两项中位数合计从约 3.41 秒降到 1.32 秒，节省约 2.08 秒。实验 API 模式三轮均为零错误、零警告；这里的速度不能用于承诺普通 --tsgo 模式也能等价通过。

普通 --tsgo 连续三次在 src/routes/console/account/+page.svelte:31 的 content(close)
snippet 上报告 TS7006：close 隐式为 any；TS6 不报错。改用 --tsgo-experimental-api 后检查通过。这是检查路径之间的诊断差异，本轮没有据此把应用代码认定为运行时错误，也没有为消除试验诊断而改应用类型。

临时安装与 alias 均不进入 package.json 或 pnpm-lock.yaml；检查后移除了项目 node_modules 下用于试验的 alias。

## 何时重新考虑

当类型检查持续达到十几秒以上、编辑器确有类型分析卡顿，或 Svelte 工具和 ESLint 明确支持同一条稳定 TS7 路径时，重新测量实际工作流。这个时间阈值是本项目的维护取舍建议，不是官方标准。

[TS7.1 Beta 公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/#typescript-71-api)已提供新的 API 入口，但截至本轮它仍是 Beta；API 发布也不等于 Kit、svelte-check、typescript-eslint 和编辑器立即完成适配。应以这些工具实际发布的兼容版本为触发条件，而不是只等 TypeScript 主版本号变化。

若未来只想先加速 E2E 检查，可以保留 typescript@6，仅增加 @typescript/native
alias，并显式调用其编译器；这是较小的试点范围，但目前每次不到一秒的节省不足以支持立即增加一个长期依赖。
