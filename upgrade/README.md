# 依赖升级状态

截至 2026-10-31，SvelteKit 与检查工具组已完成升级。实际安装版本如下；历史调研报告中的原始版本和迁移清单不代表当前待办。

| 依赖                                                                           | 已安装 | 状态                                 |
| ------------------------------------------------------------------------------ | ------ | ------------------------------------ |
| [@sveltejs/kit](requires-code-changes/sveltejs-kit.md)                         | 3.1.0  | 已完成 Kit 3 应用、配置与测试迁移    |
| [@sveltejs/adapter-node](requires-code-changes/sveltejs-adapter-node.md)       | 6.0.0  | 已完成本地迁移，生产入口检查另行跟踪 |
| [@sveltejs/vite-plugin-svelte](no-code-changes/sveltejs-vite-plugin-svelte.md) | 7.3.1  | 已完成                               |
| [vite](no-code-changes/vite.md)                                                | 8.3.5  | 已完成                               |
| [svelte-check](requires-code-changes/svelte-check.md)                          | 4.7.7  | 已完成，使用 TS6 检查                |
| [runed](no-code-changes/runed.md)                                              | 0.38.0 | 已完成，与 Kit 3 的 peer 匹配        |
| [typescript](requires-code-changes/typescript.md)                              | 6.0.3  | TS6 目标已完成；TS7 另行评估         |

TypeScript 7 的收益、兼容成本和本项目对比结果见
[TypeScript 评估](requires-code-changes/typescript.md)。本轮不安装 TS7 到项目依赖。

- [升级记录](../UPGRADING_RECORD.md)保留各阶段进度。
- [版本依赖关系](version-constraints.md)记录当前组合的约束。
- [部署后检查](post-deployment-checks.md)仍需在真实 Fly.io 入口验证 origin、CSRF 和重定向。

## 已完成的浏览器测试组

- [vitest](no-code-changes/vitest.md)：5.0.5。
- [@vitest/browser-playwright](no-code-changes/vitest-browser-playwright.md)：5.0.5，与 Vitest 精确匹配。
- [vitest-browser-svelte](requires-code-changes/vitest-browser-svelte.md)：3.1.0，组件测试已迁移为
  `await render`。
