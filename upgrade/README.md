# 剩余依赖升级

本目录跟踪尚未完成的7个依赖，并保留已完成的浏览器测试组迁移报告。版本与进度以
[UPGRADING_RECORD.md](../UPGRADING_RECORD.md)
为准；每份报告保留原始当前版本、目标版本、官方证据和迁移资料。

- `requires-code-changes/`：4个待办，需要修改应用、测试、配置或脚本。
- `no-code-changes/`：3个待办，未发现独立代码迁移点，但因配套版本不兼容已回撤，需等待关联迁移，不能单独批量更新。
- [版本依赖关系](version-constraints.md)记录剩余依赖应如何配套。

## 需要代码迁移

| 依赖                                                                     | 当前版本  | 目标版本 | 待办                                                           |
| ------------------------------------------------------------------------ | --------- | -------- | -------------------------------------------------------------- |
| [@sveltejs/adapter-node](requires-code-changes/sveltejs-adapter-node.md) | `^5.5.2`  | `^6.0.0` | 迁移origin配置及现有测试夹具；随Kit3升级。                     |
| [@sveltejs/kit](requires-code-changes/sveltejs-kit.md)                   | `^2.50.1` | `^3.1.0` | 迁移Vite配置、别名、tsconfig、类型导入、remote forms及重定向。 |
| [typescript](requires-code-changes/typescript.md)                        | `^5.9.3`  | `^7.0.2` | 处理原生编译器、Compiler API兼容和双版本检查脚本。             |
| [svelte-check](requires-code-changes/svelte-check.md)                    | `^4.3.6`  | `^4.7.7` | 配合Kit3配置读取和TS7原生检查模式调整脚本。                    |

## 等待配套升级

| 依赖                                                                           | 当前版本  | 目标版本  | 待办                              |
| ------------------------------------------------------------------------------ | --------- | --------- | --------------------------------- |
| [@sveltejs/vite-plugin-svelte](no-code-changes/sveltejs-vite-plugin-svelte.md) | `^6.2.4`  | `^7.3.1`  | 已回撤；等待Kit3/Vite8配套。      |
| [vite](no-code-changes/vite.md)                                                | `^7.3.1`  | `^8.3.5`  | 已回撤；当前Kit2不支持目标Vite8。 |
| [runed](no-code-changes/runed.md)                                              | `^0.37.1` | `^0.38.0` | 已回撤；目标0.38要求Kit3。        |

## 已完成的浏览器测试组

- [vitest](no-code-changes/vitest.md)：5.0.5。
- [@vitest/browser-playwright](no-code-changes/vitest-browser-playwright.md)：5.0.5，与 Vitest 精确匹配。
- [vitest-browser-svelte](requires-code-changes/vitest-browser-svelte.md)：3.1.0，组件测试已迁移为
  `await render`。
