# 部署后检查

## SvelteKit 3 origin 与反向代理

状态：待部署后核验。本轮保留现有 origin 配置，不把开发地址或生产域名固定进共用构建产物。

本地 E2E 已通过 `PROTOCOL_HEADER=x-forwarded-proto` 和请求头
`x-forwarded-proto: http`
明确协议；测试服务器仅监听回环地址。此设置仅用于测试，不代表已核验生产代理的可信请求头。

SvelteKit 3 的 adapter-node 不再读取 `ORIGIN`；未配置 `paths.origin`
时，从请求 URL 推导 origin。`APP_URL`
是本项目的应用配置，不会自动设置 Kit 的 origin。

- [ ] 在 Fly.io 的真实 HTTPS 入口确认应用看到的协议、Host 和 origin 与
      `https://exodus.ing` 一致；核对反向代理请求头及 adapter 的可信代理配置。
- [ ] 验证登录、OAuth 回调、收藏、发布和邀请码操作；确认同源表单和 remote
      function 请求不会被错误拒绝为 CSRF，并确认非可信跨源提交仍被拒绝。
- [ ] 若请求头无法可靠还原公开 origin，再配置
      `sveltekit({ paths: { origin } })`。该值写入构建产物，必须在构建时提供正确的生产值；不能仅依赖 Fly.io 的运行时
      `APP_URL`。
- [ ] 保留 E2E 每个测试的动态端口；确保共用构建产物不固定 origin，继续从实际请求推导。
- [ ] 核对 `ORIGIN` 是否还有其他消费者，再清理 E2E 夹具与相关文档中的旧变量。

依据：[官方 origin 配置说明](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Configuration-Added-options)
和
[adapter-node 迁移说明](https://svelte.dev/docs/kit/migrating-to-sveltekit-3#Adapters-adapter-node)。
