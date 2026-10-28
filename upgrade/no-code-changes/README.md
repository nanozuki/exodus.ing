# 等待配套升级

这里只保留未完成的5个依赖；参见[剩余工作索引](../README.md)及[版本关系](../version-constraints.md)。

| 依赖                                                           | 当前版本  | 目标版本  | 待办                                   |
| -------------------------------------------------------------- | --------- | --------- | -------------------------------------- |
| [@sveltejs/vite-plugin-svelte](sveltejs-vite-plugin-svelte.md) | `^6.2.4`  | `^7.3.1`  | 已回撤；等待Kit3/Vite8配套。           |
| [@vitest/browser-playwright](vitest-browser-playwright.md)     | `^4.0.18` | `^5.0.5`  | 已回撤；必须与Vitest保持精确版本一致。 |
| [vite](vite.md)                                                | `^7.3.1`  | `^8.3.5`  | 已回撤；当前Kit2不支持目标Vite8。      |
| [vitest](vitest.md)                                            | `^4.0.18` | `^5.0.5`  | 已回撤；等待browser-svelte3迁移。      |
| [runed](runed.md)                                              | `^0.37.1` | `^0.38.0` | 已回撤；目标0.38要求Kit3。             |
