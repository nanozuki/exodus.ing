# runed

执行状态：2026-10-31 已升级并安装 0.38.0，与 Kit
3.1.0 配套；无需修改现有 resource 消费者。此前因 Kit
2 配套限制回撤的阻塞已解除。

- 原版本：`^0.37.1`
- 目标版本：`^0.38.0`
- 版本来源：`UPGRADING_RECORD.md`。
- 调研日期：2026-10-28。
- 分类：**无需代码迁移（按当前调研）**。唯一 resource 调用接口不变；Kit3
  peer 通过协调依赖版本满足，未使用发生 breaking 的 runed/kit API。

## 使用与变更

唯一直接用法在 `src/routes/a/[articleId]/edit/MarkdownEditor.svelte`：从 `runed`
主入口导入 `resource`，传入内容 getter、async 编译函数及
`{ debounce: 500 }`，读取 `.current`。没有导入 `runed/kit` 或使用
`useSearchParams`。

[官方 0.38.0 changelog](https://github.com/svecosystem/runed/blob/runed%400.38.0/packages/runed/CHANGELOG.md#0380)唯一功能变更是 breaking：`runed/kit`
要求 SvelteKit 3，`useSearchParams` 改用 `$app/env` 及 Kit
3 的 goto 选项。此 API 改动不命中编辑器 resource，现有调用不需要据此重写。

但[官方 package.json](https://github.com/svecosystem/runed/blob/runed%400.38.0/packages/runed/package.json)将 optional
peer `@sveltejs/kit` 声明为 `^3.0.0`，Svelte peer 仍为 `^5.7.0`，zod 为
`^4.1.0`。optional 表示不强制安装；本项目已经安装 Kit，因此不能把 Kit 2 与 runed
0.38 组合视为已满足依赖。应随 Kit 3 升级，批量更新时须与 Kit3 配套。

上述 peer 同时由[固定目标 0.38.0 的官方 npm 元数据](https://registry.npmjs.org/runed/0.38.0)交叉核实，并非依据未来会变动的 main 分支推断。

## 官方迁移资料与验证

没有找到独立的 runed
0.38 迁移指南；以[官方变更 PR #432](https://github.com/svecosystem/runed/pull/432)及上述 changelog 为依据；涉及 Kit 的部分参考
[Kit 3 官方迁移指南](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)。

升级阶段验证 Markdown 输入防抖、异步结果顺序、编辑/预览切换与标题/校验回调；本轮已执行升级；验证结果见[升级记录](../../UPGRADING_RECORD.md)。现有发布 E2E 覆盖 Markdown 编辑、预览与发布，不代表对 resource 内部并发顺序做了独立验证。
