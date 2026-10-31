# 依赖的版本关系

2026-10-31 已安装组合如下。原始迁移资料见[升级索引](README.md)。

## Kit 与构建组（已完成）

| 依赖                         | 已安装 | 配套要求                                                     |
| ---------------------------- | ------ | ------------------------------------------------------------ |
| @sveltejs/kit                | 3.1.0  | plugin 7、Vite 至少 8.0.12、TypeScript 6、Svelte 至少 5.57.1 |
| @sveltejs/adapter-node       | 6.0.0  | Kit 3；生产 origin 验证见部署后检查                          |
| @sveltejs/vite-plugin-svelte | 7.3.1  | Vite 8                                                       |
| vite                         | 8.3.5  | 与 Kit 3/plugin 7 配套                                       |
| runed                        | 0.38.0 | optional Kit peer 为 ^3.0.0；项目已安装 Kit，必须满足此范围  |

## 浏览器测试组（已完成）

| 依赖                       | 已安装 | 配套要求                  |
| -------------------------- | ------ | ------------------------- |
| vitest-browser-svelte      | 3.1.0  | 组件测试使用 await render |
| vitest                     | 5.0.5  | 与 browser-svelte 3 配套  |
| @vitest/browser-playwright | 5.0.5  | 与 Vitest 精确版本匹配    |

## TypeScript 与检查工具组

| 依赖              | 已安装 | 配套要求                                                       |
| ----------------- | ------ | -------------------------------------------------------------- |
| typescript        | 6.0.3  | 满足当前 Kit、svelte-check 和 typescript-eslint 的 peer        |
| svelte-check      | 4.7.7  | 同名 TypeScript peer 为 5/6；TS7 需要另装 alias 和原生检查模式 |
| typescript-eslint | 8.72.1 | TypeScript peer 为 >=4.8.4 <6.1.0                              |

TS6 迁移已完成。TS7 尚未加入项目依赖；建议和实测见
[TypeScript 评估](requires-code-changes/typescript.md)。如后续采用，保留 typescript 为 TS6，并通过 @typescript/native
alias 添加 TS7，避免破坏旧 Compiler API 消费者。

## 官方依据

- [Kit 3 迁移指南](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)。
- [runed 0.38 发布记录](https://github.com/svecosystem/runed/blob/runed%400.38.0/packages/runed/CHANGELOG.md)。
- [svelte-check 4.7.7 的 TS7 使用说明](https://github.com/sveltejs/language-tools/blob/svelte-check%404.7.7/packages/svelte-check/README.md)。

具体 peer 范围另经本地安装包 package.json 和 pnpm-lock.yaml 核对。
