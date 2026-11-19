# 用注释替代 shape 契约：讨论草稿

## 背景：shape 的问题

使用 `/shape` 一段时间后发现的问题：

1. **签名完全重复。** shape 里的 TypeScript 代码块和源码签名几乎逐字相同，等于手工维护两份。
2. **单独成文件也没有让阅读和 diff 变容易。** Git diff 以行为单位，而我们需要以"声明"为单位；一个目录下的不同文件被放在一起，也难以阅读。
3. **shape 的文字混合了三类内容：**
   - **接口契约**：调用方需要知道的东西，比如"校验失败时不写库"。这部分本来就该写在注释里，现在的代码注释也已经写了。
   - **目录边界和归属规则**：比如"use case 不读环境变量""remote 负责把 issues 映射到字段"。这类规则没有声明可以挂靠，是 shape 真正独有的部分。
   - **变更指令**：比如"Preserve existing substring matching""Missing articles retain NOT_FOUND"。这是写给某一次修改的要求，修改完成后就失效了，应该放在 PR 或计划里，不该长期留在文档中。
4. **三重重复。** `docs/architecture.md` 已经有 Use Cases、Repositories、Request Boundaries 等章节。所以 shape 开头的目录说明很可能与它重复，再加上和代码注释的重复，同一条规则最多写了三遍。这违反了 `docs/code-style.md` 中 "Keep each fact in one authoritative place" 的原则。

## 方向：以代码为唯一来源，用工具生成按声明组织的视图

### 声明契约：各语言的标准文档注释（建议，待定）

- 建议导出声明的契约使用各语言的标准文档注释：TS 用 `/** */`，Go 用紧贴声明的 `//`，Rust 用 `///`。TS 中的实现说明继续用 `//`。
  - TS 语言服务（所有基于 tsserver 的编辑器都一样）只把 `/** */` 当作文档：普通的 `//` 和 `/* */` 不会出现在悬停提示里；`/** */` 与声明之间隔一个空行仍然有效。这一点已在 TS 6.0.3 上验证。
  - 提取器只收文档注释，这样契约和实现说明就有了明确的边界，IDE 和契约 diff 看到的也是同一份内容。
- 标签要少用。`@param`、`@returns` 容易变成重复类型信息的废话；真正有价值的通常只有 `@throws`、`@deprecated`，偶尔用 `@example`。是否遵循 TSDoc 标签规范、是否加 `eslint-plugin-tsdoc`，可以另外决定。
- Svelte 组件：组件说明写在 `<!-- @component ... -->` 里，各个 prop 在 `Props` 类型上写 `/** */`。
- 如果采用这个方案，需要修改 `docs/code-style.md`，它现在规定一律使用 `//`。
- 注释收紧：只写调用方视角的内容，不写变更指令。

### 目录级规则：Markdown

TS 没有目录级模块的概念：一个文件就是一个 ES module，JSDoc/TypeDoc 的 `@module` 也只描述所在的文件。业内常见做法：

| 生态 | 做法 |
|---|---|
| Go | `doc.go` 里的 `// Package foo ...` |
| Rust | `mod.rs` / `lib.rs` 里的 `//!` |
| Python | `__init__.py` 的模块 docstring |
| Java | `package-info.java` |
| JS/TS | 目录 `README.md`（GitHub 浏览目录时会自动渲染） |

结论：

- 不用 `doc.ts`。TS 生态里没有这个约定，IDE 和 TypeDoc 都不会把它和目录关联，GitHub 也不会渲染它。（TS 6.0.3 下，只含注释的文件不会报 TS1208，不需要 `export {}`，但其他缺点仍在。）
- 不用 `index.ts` 加 `@module` 当锚点。它要求每个目录都有 index 文件；如果做成 barrel，还会带来循环导入和打包体积的问题。
- 目录规则用 Markdown 写。**待定**：收敛到 `docs/architecture.md`（倾向），还是放进各目录的 `README.md`。两者只能选一个，不能两边都写。
- 能表达成导入规则的边界约束，交给 `dependency-cruiser` 或 `eslint-plugin-boundaries` 做机器检查，比写成文字更可靠。

### 相关工具的区分

- **JSDoc**：既是注释写法，也是一个 JS 文档生成器，诞生于没有类型系统的年代。
- **TSDoc**：微软制定的 TS 注释语法规范，只有规范和解析器，不生成文档。
- **TypeDoc**：TS 文档生成器，通过 TS 编译器读取类型，可以输出 HTML 或 JSON。它可以通过 `{@include}`、`@document` 或 `projectDocuments` 引入 Markdown，但不会自动把目录 README 和模块关联起来。
- **API Extractor**：生成 `.api.md` 的 API report，用于在 PR 里审查 API 变化，但面向库的包入口，用在应用的内部模块上比较别扭。

## 提取层：默认用 tree-sitter

多语言工具的现状：

- **文档生成器**（Doxygen、Sphinx、mkdocstrings、Natural Docs 等）：目标是生成文档站点，都不输出按声明的变更视图。
- **API 变更检测**（Go 的 `apidiff`、Rust 的 `cargo-public-api`、Java 的 `japicmp`、Python 的 `griffe`、TS 的 API Extractor）：每种语言各有一套，关注签名兼容性，大多不比较注释。
- **跨语言底层**：tree-sitter、LSP、SCIP。

**决定：默认使用 tree-sitter，遇到具体语言再灵活处理。**

- 统一模型是"定义 + 相邻文档注释 + 签名（去掉函数体后的文本）"。每加一种语言只需要写一份查询，可以参考各语法自带的 `tags.scm`。
- tree-sitter 不做类型解析，契约 diff 也用不到。
- 签名要先规范化再比较，避免格式化改动被误判成变更。

### Svelte

- 可以使用 `@tree-sitter-grammars/tree-sitter-svelte`（已到 1.0.x，Zed 用的就是它，支持 Svelte 5 的 snippet、`{@render}`）。
- `<script lang="ts">` 的内容在语法树里是原始文本，要再交给 `tree-sitter-typescript` 解析，可以用 included ranges。
- runes（`$props()` 等）在语法上是普通函数调用，不需要专门支持。
- 已知问题：`generics` 属性里的 TS 泛型目前处理不好。
- 组件契约要用专门的规则组合：`@component` 说明、`Props` 类型、各 prop 的 `/** */`。
- 备选：Svelte 官方的 `svelte/compiler` `parse()` 也能产出 ESTree AST，单看 Svelte 时更可靠。

## Diff 的展示

分三层：

1. **工具只输出结构化 JSON。** 键为 `path#symbol`，变更分为新增、删除、签名变更、仅注释变更四类，并带上修改前后的签名和注释。这是唯一的事实来源，确定且可测试。做法是对 base 和 head 各提取一次，再按键比较。
2. **HTML 作为主要审阅界面。** 按模块分组和折叠，在声明内部做词级 diff，修改前后并排显示，并能按变更类型过滤。目录说明放在对应模块分组的开头，由渲染脚本直接读取。
3. **Markdown PR 评论（可选，晚点再做）。** 只做通知和索引：列出变更清单，每项一个 `<details>` 折叠块，并附上 HTML 的链接。

agent 不在对话里直接输出 diff，因为它的转述不确定，可能漏掉条目，而审批需要的是工具直接生成的原始结果。agent 的职责是读 JSON，说明这次变更的意图和需要重点看的地方，并给出 HTML 的路径。

## 审批流程

用"先写桩"代替单独的 shape 文件：

1. 设计阶段只写签名和 `/** */`，函数体写 `throw new Error('TODO')`。
2. 用户审阅契约 diff 的 HTML 并批准。
3. 之后再写实现。

`/shape` skill 的"推导契约"和"检查一致性"两个模式基本不再需要，因为契约就是代码本身。`AGENTS.md` 中关于 `docs/shapes/` 的审批边界需要相应修改。

## 待定问题

- 契约是否使用各语言的标准文档注释（TS 为 `/** */`），以及是否遵循 TSDoc 标签规范。
- 目录规则放在 `docs/architecture.md` 还是各目录的 `README.md`。
- 主要在 GitHub 上还是在本地审阅，这决定了要不要做 Markdown PR 评论。
- 这个工具放在本仓库内，还是做成跨项目通用的工具或 skill。
- 迁移的工作量：现有 shape 中的每一条规则都要判断归属，是放进目录文档、写成注释、改成 lint 规则，还是作为变更指令直接删除。

## 建议的第一步

拿 `src/lib/server/use-cases` 做试点：

1. 收紧现有注释的内容（如果确定采用文档注释，也一并改成 `/** */`）。
2. 实现 tree-sitter 提取和 JSON diff，生成本地 HTML 原型。
3. 把这个目录的 shape 精简到只剩边界规则，并与 `docs/architecture.md` 去重。
4. 看过效果之后，再决定是否推广到其他目录。
