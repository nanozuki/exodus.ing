# @sveltejs/adapter-node

- 当前版本：`^5.5.2`
- 目标版本：`^6.0.0`
- 版本来源：`UPGRADING_RECORD.md`。
- 调研日期：2026-10-28。
- 分类：**需要修改代码**。现有 e2e/support/fixtures.ts 显式设置 ORIGIN，目标版本移除此配置，需要改为 Kit
  paths.origin，并调整启动配置；此处与 Docker 无关。

## 实际使用

`svelte.config.js` 使用默认 `adapter()`；`Dockerfile` 复制 build 后以
`node build` 启动，基础镜像为 Node 22.17.0；`e2e/support/fixtures.ts`
启动产物时设置 `ORIGIN` 与
`APP_URL`。没有自定义 adapter 或 instrumentation 文件。

## 变化与影响

依据[固定 6.0.0 tag 的官方 changelog](https://github.com/sveltejs/kit/blob/%40sveltejs%2Fadapter-node%406.0.0/packages/adapter-node/CHANGELOG.md)核查 5.5.2→6.0.0。先覆盖该区间内 5.x 后续版本：

| 版本  | 相关变化与项目关联                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.5.3 | 启动时校验 ORIGIN，升级 CommonJS bundling 插件；E2E 明确设置 origin、Docker 使用打包产物，需一起验证                                                                                       |
| 5.5.4 | Rollup 4.59.0 更新，属于当前构建路径的内部工具变更；最终 6.0 以 Rolldown 替代                                                                                                              |
| 5.5.5 | entrypoints 与应用代码一起打包，日志显示真实监听地址；影响独立 Node 产物启动与部署诊断                                                                                                     |
| 5.5.6 | 修复 server 初始化/hooks 循环依赖导致的启动崩溃，修复 server root 解析并确保 ENV_PREFIX 已定义；本项目有 server init hook，必须覆盖启动场景                                                |
| 5.5.7 | SSE 响应添加 X-Accel-Buffering:no；启动时删除已有 socket 文件。当前项目服务监听 TCP、未用 query.live SSE，未发现这两项需要改应用；项目 PostgreSQL socket 与 adapter 监听 socket 不混为一谈 |

以下为 6.0.0 发布的变化：

- 必须使用 SvelteKit 3、Vite 至少 8.0.12；构建改 Rolldown，不能与 Kit
  2 单独升级。配置迁到 Vite 插件，见 kit 报告。
- `ORIGIN` 被移除，改用 Kit 的
  `paths.origin`。E2E 夹具显式传了 ORIGIN，应改用新配置并确认测试/生产不同 APP_URL 的解析时机；APP_URL 是本项目变量，不会自动等价于新的 paths.origin。
- 静态资源从构建期列表提供，部署后新增文件不会被服务；替换文件仍沿用构建期元数据。本项目 Docker 复制完整构建目录，未发现运行期写入静态目录，但部署方式必须遵循新约束。
- 静态资源 ETag 改内容 hash，移除 Last-Modified；只处理 GET/HEAD，其余方法返回 405。影响真实 HTTP 响应及缓存语义，即便应用调用没变也属于相关变化。
- 服务端依赖打包修复：devDependencies 总是打包、dependencies 中的 Svelte 库也打包，且避免重复打包。`runed`
  属于 dependencies，需验证构建产物与 prod-only node_modules 能独立运行。
- 静态 Content-Type 使用 manifest，未预压缩资源不再无故 Vary:
  Accept-Encoding；trailing-slash 重定向修复保留路径前缀并避免 scheme-like 路径导致站外跳转。
- HTTP 连接提前关闭时取消 request.signal；改为直接连接 HTTP
  server、不再通过 polka，错误日志改进。当前没有依赖 polka 的扩展，但应验证服务启动、终止及请求处理。
- instrumentation 环境初始化/API 改动、OpenTelemetry
  externalization 属于 breaking/修复；当前未使用 instrumentation，暂不需要相应代码迁移。

## 官方迁移指南与验证

[SvelteKit v3 官方迁移指南的 adapter-node 部分](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Adapters-adapter-node)列出 Rolldown、origin、静态文件与缓存迁移；未发现独立于该指南的 adapter-node
6 专门指南。

实际升级后验证生产构建与 `node build`，E2E 登录 cookie/CSRF
origin，静态资源 GET/HEAD/非 GET 响应及条件请求、压缩、MIME。本轮未升级或执行目标版本测试。
