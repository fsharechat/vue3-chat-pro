# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指引。

## 语言要求

**所有回复必须使用中文**，包括解释、分析、建议、错误说明等，代码本身除外。

## 常用命令

```bash
npm run dev        # 开发服务器，访问 http://localhost:9080
npm run build      # 类型检查 + Vite 生产构建 → dist/
npm run preview    # 预览生产构建
npm run test       # 运行 Vitest 测试
npm run test -- --watch     # 监听模式（文件变更自动重跑）
npm run test -- --coverage  # 生成覆盖率报告
```

Vitest 使用 jsdom 环境，测试位于仓库根目录 `tests/`（镜像 `src/` 的目录结构，用 `@/` 别名引用源码），文件名为 `*.test.ts`。

## 架构总览

**飞享**是基于 Vue 3 + TypeScript 的即时通讯客户端，通过自定义 JSON-over-WebSocket 协议与 [fsharechat](https://github.com/fsharechat) 后端通信。

### 通信层（`src/websocket/`）

所有实时通信逻辑集中于此。

- **`index.ts`（`VueWebSocket`）** — 原始 WebSocket 连接。负责连接/重连/心跳（每 25 s 发 PING/PONG，关闭或标签页切回前台时自动重连）。所有出站命令通过 `sendPublishMessage(subsignal, content)` 发送，返回一个 Promise，由对应 `PUB_ACK` 响应解决（10 s 超时）。
- **`websocketcli.ts`（`webSocketClient`）** — `VueWebSocket` 的单例代理，组件和 Store 统一从这里导入；内置 200 ms 防抖批量 `getUserInfos`。
- **`chatManager.ts`（`ChatManager`）** — 新消息的静态事件总线，组件通过 `addReceiveMessageListener` 注册监听。
- **`handler/`** — 每个服务端子信令对应一个 Handler 类（如 `receiveMessageHandler`、`notifyMessageHandler`），`match()` 匹配子信令，`processMessage()` 更新 Pinia Store。
- **`message/`** — 消息与内容的类型化模型（文本、图片、文件、语音、视频、位置等）。
- **`model/`** — 纯数据模型（会话、群组、用户信息、未读数等）。
- **`store/localstore.ts`** — localStorage 辅助函数（userId、token、消息 ID 计数器、已选会话）。
- **`utils/aes.ts`** — 对 localStorage 中认证 token 进行 AES 加解密。
- **协议常量**（`src/constant/index.ts`）— 所有子信令字符串代码（`MP`、`MS`、`FP`、`GC`……）及服务器地址均在此定义，**修改服务器地址只改这里**。

### 状态管理（`src/stores/`）

所有 Pinia Store 使用 Composition API setup 风格。

| Store | 职责 |
|---|---|
| `useAuthStore` | 登录状态、Token 生命周期 |
| `useConversationStore` | 会话列表、当前选中目标（`selectTarget`）、未读数 |
| `useMessageStore` | 每个会话的消息列表（最多 50 条）、AI 流式消息状态、滚动到底触发器 |
| `useUIStore` | 所有 UI 开关（弹窗、通话浮层）、用户信息缓存（`userInfoList`）、表情表、在线状态、音效播放 |
| `useFriendStore` | 好友列表、好友申请 |
| `useGroupStore` | 群组元数据 |
| `useCallStore` / `useGroupCallStore` | 单人与群组 WebRTC 通话会话 |
| `useThemeStore` | 主题（暗色/亮色） |

### 页面与路由（`src/pages/`、`src/router/`）

三个页面：`LoginPage`、`ChatPage`、`FriendPage`，路由配置在 `src/router/index.ts`。

### 组件（`src/components/`）

按业务分组：`chat/`（消息气泡、输入栏、媒体）、`conversation/`（侧边栏会话列表）、`friend/`、`group/`、`layout/`（主壳、侧边栏图标）、`common/`（关于弹窗、创建群组等）。

### WebRTC（`src/webrtc/`）

语音/视频通话，基于 `kurento-utils`。`voipclient.ts` 处理单人通话，`groupCallClient.ts` 处理群组通话。

### 文件上传

由 `src/constant/index.ts` 中的 `UPLOAD_BY_QINIU` 切换：
- `false`（默认）— MinIO 预签名 URL（`getMinioUploadUrl`）
- `true` — 七牛云（`qiniu-js`）

### 版本号注入

`package.json` 的 `version` 字段在构建时注入为全局常量 `__APP_VERSION__`（类型声明在 `src/types/`），展示于"关于飞享"对话框。

## 关键约定

- `@/` 别名指向 `src/`。
- WebSocket 层大多数文件带有 `// @ts-nocheck`，在没有完整类型覆盖前不要移除。
- 所有服务端子信令字符串代码在 `src/constant/index.ts` 中以简写形式定义，新增协议命令也在此处扩展。
- `useConversationStore.selectTarget` 是当前活跃会话的唯一数据源，消息和 UI Store 均响应它的变化。
