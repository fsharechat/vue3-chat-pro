# 飞享 · Vue3 即时通讯客户端

基于 [fsharechat](https://github.com/fsharechat) 开源即时通讯后端的 Web 客户端，使用 Vue3 + TypeScript + Naive UI 完整重写。

## 功能特性

- 私聊与群聊消息收发
- 文字、图片、语音、视频、文件、位置消息
- Markdown 消息渲染
- 实时语音 / 视频通话（WebRTC）
- 好友管理：搜索、添加、申请、别名设置
- 群组管理：创建、邀请成员、踢出、解散、退出
- 消息未读角标与浏览器标签页通知
- 新消息音效提醒
- 暗色设计系统（Void 风格）

## 技术栈

| 类别 | 依赖 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| UI 组件库 | Naive UI |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 构建工具 | Vite 5 |
| 通信协议 | WebSocket（自定义二进制协议）|
| 实时通话 | WebRTC（kurento-utils）|
| 测试框架 | Vitest + @vue/test-utils |

## 项目结构

```
src/
├── components/
│   ├── chat/          # 聊天消息相关组件
│   ├── common/        # 通用组件（关于、创建群组等）
│   ├── conversation/  # 会话列表
│   ├── friend/        # 好友相关
│   ├── group/         # 群组相关
│   └── layout/        # 侧边栏、主布局
├── pages/             # 页面（登录、聊天、好友）
├── stores/            # Pinia 状态管理
├── websocket/         # WebSocket 客户端与消息处理
├── webrtc/            # 语音/视频通话
├── constant/          # 服务器地址、协议常量
└── styles/            # 全局样式变量
```

## 环境要求

- Node.js >= 18
- npm >= 9

## 安装

```bash
# 克隆仓库
git clone git@github.com:fsharechat/vue3-chat-pro.git
cd vue3-chat-pro

# 安装依赖
npm install
```

## 配置

服务器地址统一在 `src/constant/index.ts` 中配置：

```ts
// WebSocket 服务器
export const WS_PROTOCOL = 'wss'               // 本地调试改为 'ws'
export const WS_IP = 'backend-websocket.fsharechat.cn/ws'
export const WS_PORT = 9326

// HTTP 接口
export const HTTP_PROTOCOL = 'https'           // 本地调试改为 'http'
export const HTTP_IP = 'backend-http.fsharechat.cn'

// 文件存储（默认使用 MinIO，改为 true 则使用七牛云）
export const UPLOAD_BY_QINIU = false
```

> 如需对接自建后端，将上述地址替换为你的服务器地址即可，无需其他改动。

### 高德地图（位置消息）

位置消息功能依赖高德地图 JS API，在 `src/components/chat/LocationMessage.vue` 中替换 Key：

```ts
AMapLoader.load({ key: '你的高德地图 Key', ... })
```

高德开放平台申请地址：[https://lbs.amap.com](https://lbs.amap.com)

## 开发运行

```bash
npm run dev
```

浏览器访问 [http://localhost:9080](http://localhost:9080)

## 生产构建

```bash
npm run build
```

产物输出到 `dist/` 目录，可直接部署到任意静态服务器（Nginx、Caddy 等）。

构建预览：

```bash
npm run preview
```

## 登录说明

登录方式为**手机号或邮箱 + 验证码**，使用 [fsharechat](https://github.com/fsharechat) 后端服务。

默认连接的是飞享官方测试服务器，可直接注册体验，也可自行部署后端后修改 `src/constant/index.ts` 中的地址。

## 测试

项目使用 [Vitest](https://vitest.dev/) 作为测试框架，配合 `@vue/test-utils` 编写组件单元测试。

```bash
# 运行全部测试
npm run test

# 监听模式（文件变更时自动重跑）
npm run test -- --watch

# 生成测试覆盖率报告
npm run test -- --coverage
```

测试文件约定放在与源文件同目录下，命名为 `*.test.ts` 或 `*.spec.ts`。

## 版本说明

当前版本号由 `package.json` 中的 `version` 字段统一管理，构建时通过 Vite `define` 注入为全局常量 `__APP_VERSION__`，在"关于飞享"对话框中展示。

## License

MIT
