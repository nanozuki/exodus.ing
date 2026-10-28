# 需要代码迁移

这里列出未完成的4个依赖；已完成的浏览器测试组报告保留供追溯。参见[剩余工作索引](../README.md)及[版本关系](../version-constraints.md)。

| 依赖                                               | 当前版本  | 目标版本 | 待办                                                           |
| -------------------------------------------------- | --------- | -------- | -------------------------------------------------------------- |
| [@sveltejs/adapter-node](sveltejs-adapter-node.md) | `^5.5.2`  | `^6.0.0` | 迁移origin配置及现有测试夹具；随Kit3升级。                     |
| [@sveltejs/kit](sveltejs-kit.md)                   | `^2.50.1` | `^3.1.0` | 迁移Vite配置、别名、tsconfig、类型导入、remote forms及重定向。 |
| [typescript](typescript.md)                        | `^5.9.3`  | `^7.0.2` | 处理原生编译器、Compiler API兼容和双版本检查脚本。             |
| [svelte-check](svelte-check.md)                    | `^4.3.6`  | `^4.7.7` | 配合Kit3配置读取和TS7原生检查模式调整脚本。                    |
