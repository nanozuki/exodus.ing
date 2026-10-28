# 剩余依赖的版本关系

这里只记录尚未完成的升级及其配套关系，原始版本与目标见[剩余工作索引](README.md)。

## Kit与构建组

| 依赖                         | 保留版本 | 目标   | 配套要求                                                       |
| ---------------------------- | -------- | ------ | -------------------------------------------------------------- |
| @sveltejs/kit                | 2.50.1   | 3.1.0  | 目标要求plugin7、Vite至少8.0.12、TypeScript6；需要完成应用迁移 |
| @sveltejs/adapter-node       | 5.5.2    | 6.0.0  | adapter6要求Kit3；origin配置与测试夹具同步迁移                 |
| @sveltejs/vite-plugin-svelte | 6.2.4    | 7.3.1  | plugin7要求Vite8；当前Kit2只接受plugin3/4next/5/6next范围      |
| vite                         | 7.3.1    | 8.3.5  | 当前Kit2只接受Vite5/6/7beta范围，因此Vite8目标等待Kit3         |
| runed                        | 0.37.1   | 0.38.0 | runed0.38要求Kit3；当前只用resource，无独立API改写任务         |

建议在完成Kit3迁移时一起处理这五项，不能通过只更新Vite或plugin绕开Kit的peer约束。

## 浏览器测试组

| 依赖                       | 保留版本 | 目标  | 配套要求                                              |
| -------------------------- | -------- | ----- | ----------------------------------------------------- |
| vitest-browser-svelte      | 2.0.2    | 3.1.0 | 当前2.0.2只支持Vitest4；目标3要求现有测试await render |
| vitest                     | 4.0.18   | 5.0.5 | 等待browser-svelte迁移后升级                          |
| @vitest/browser-playwright | 4.0.18   | 5.0.5 | provider与Vitest要求精确版本相同，不只是主版本匹配    |

应将三者目标同时安装，避免browser-svelte2与Vitest5或provider/Vitest版本不同的组合。

## TypeScript与检查工具组

| 依赖         | 保留版本 | 目标  | 配套要求                                                               |
| ------------ | -------- | ----- | ---------------------------------------------------------------------- |
| typescript   | 5.9.3    | 7.0.2 | 当前Kit2要求TS^5.3.3，目标Kit3要求TS^6.0.0；不能直接换成TS7            |
| svelte-check | 4.3.6    | 4.7.7 | 目标同名TypeScript peer为5/6；TS7检查需要原生模式参数及双版本alias布局 |

后续先确定TS6兼容工具与TS7原生CLI的共存方案，再调整check/check:watch/check:e2e入口及有效tsconfig。其他现有工具的Compiler API兼容约束在TypeScript独立报告中作为迁移条件保留。

## 官方依据

- [Kit2.50.1发布元数据](https://registry.npmjs.org/@sveltejs/kit/2.50.1)、[Kit3.1.0](https://registry.npmjs.org/@sveltejs/kit/3.1.0)。
- [adapter-node6](https://registry.npmjs.org/@sveltejs/adapter-node/6.0.0)、[plugin7.3.1](https://registry.npmjs.org/@sveltejs/vite-plugin-svelte/7.3.1)、[runed0.38](https://registry.npmjs.org/runed/0.38.0)。
- [browser-svelte2.0.2](https://registry.npmjs.org/vitest-browser-svelte/2.0.2)、[provider4.0.18](https://registry.npmjs.org/@vitest/browser-playwright/4.0.18)、[provider5.0.5](https://registry.npmjs.org/@vitest/browser-playwright/5.0.5)。
- [svelte-check4.7.7](https://registry.npmjs.org/svelte-check/4.7.7)。各包的官方发布记录和迁移指南见独立报告。
