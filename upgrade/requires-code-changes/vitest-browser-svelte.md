# vitest-browser-svelte

- 调研日期：2026-10-28。
- 清单当前版本：`^2.0.2`；清单目标版本：`^3.1.0`。固定比较区间：`2.0.2 < version <= 3.1.0`。
- 分类：**需要修改代码**。现有 Dialog.svelte.test.ts 把 render 当成同步函数，目标版本必须改为 await render(DialogTest)。

## 项目用法

`src/lib/component/Dialog.svelte.test.ts:6` 当前为 `const screen = render(DialogTest)`，之后立即调用 `screen.getByRole`。测试还使用 locator 的 click / fill 和 Vitest 的 `expect.element`。当前配置运行 Chromium Browser Mode。

## 区间变更

| 引入版本      | 官方变更                       | 项目影响                                                 |
| ------------- | ------------------------------ | -------------------------------------------------------- |
| 2.1.0         | render 加入 trace mark         | 普通断言无需改写。                                       |
| 2.1.1         | 移走 @playwright/test 隐式依赖 | 项目已有显式声明。                                       |
| 2.2.0 / 2.2.1 | wrapper 新选项 / 无显著变化    | 当前未使用，无迁移。                                     |
| 3.0.0         | render 仅提供异步形式          | 必须改为 `const screen = await render(DialogTest)`。     |
| 3.1.0         | 支持 Vitest5                   | 配套更新；peer 的 Svelte 范围含3/4/5，Vitest 范围含4/5。 |

每项依据：[2.1.0](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v2.1.0)、[2.1.1](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v2.1.1)、[2.2.0](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v2.2.0)、[2.2.1](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v2.2.1)、[3.0.0](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v3.0.0)、[3.1.0](https://github.com/vitest-community/vitest-browser-svelte/releases/tag/v3.1.0)。peer 另以 [3.1.0 官方发布包元数据](https://registry.npmjs.org/vitest-browser-svelte/3.1.0) 核对。

## 官方迁移指南与验证

Vitest 官方迁移指南专门覆盖 [render 改为 async](https://vitest.dev/guide/migration/#render-is-async-in-vitest-browser-vue-and-vitest-browser-svelte)。本库未找到独立迁移指南，3.0.0 release 是库自身的 breaking 说明。

后续验证 Dialog 的打开、关闭、焦点归还、重开后丢弃草稿，运行 `pnpm test:unit --run --project client` 与类型检查；同时核查 Vitest 5 locator 默认精确匹配。本轮仅记录，未改测试或安装目标版本。
