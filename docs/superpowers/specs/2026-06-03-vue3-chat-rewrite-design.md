# Vue3 Chat Pro 重写设计文档

**日期**: 2026-06-03  
**原项目**: vue-chat-pro（Vue 2.5 + Vuex + Webpack 2）  
**目标项目**: vue-chat-pro-claude（Vue 3.4 + Pinia + Vite 5 + TypeScript + Naive UI）

---

## 一、目标与范围

将飞享（fsharechat）Web 客户端从 Vue 2 完整重写为 Vue 3，保留所有原有功能，采用 frontend-design 高质量 UI 设计，引入深色/浅色主题切换，不改变后端 WebSocket 协议。

### 功能范围（全量迁移）

- 手机号/邮箱验证码登录
- 会话列表（搜索、置顶、免打扰、未读数）
- 多类型消息：文字、图片、视频、音频（AMR）、文件、位置
- WebRTC 一对一音视频通话
- 群组视频通话
- 好友管理：列表、搜索、添加、好友请求处理
- 群组管理：创建、添加/踢出成员、改名、退出、解散
- 消息操作：撤回、转发、删除、复制
- AI 流式消息（SSE streaming）+ Markdown 渲染
- 消息已送达/已读回执
- 浏览器通知 + 音效通知
- 深色/浅色主题切换（新增）

---

## 二、技术栈

| 类别 | 原项目 | 新项目 |
|------|--------|--------|
| 框架 | Vue 2.5 | Vue 3.4 + `<script setup>` |
| 状态管理 | Vuex 3 | Pinia 2 |
| 路由 | Vue Router 3 | Vue Router 4 |
| UI 库 | Element UI 2 | Naive UI 2 |
| 样式 | Stylus | CSS Variables + Scoped CSS |
| 构建工具 | Webpack 2 | Vite 5 |
| 类型系统 | JavaScript | TypeScript 5 |
| WebSocket 层 | 原样保留 | 原样迁移 + TS 类型声明 |

---

## 三、项目结构

```
vue-chat-pro-claude/
├── src/
│   ├── assets/
│   │   ├── fonts/            # iconfont（原样迁移）
│   │   ├── img/
│   │   └── emoji/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.vue       # 三列主骨架
│   │   │   └── AppSidebar.vue      # 侧边栏（原 mycard.vue）
│   │   ├── chat/
│   │   │   ├── MessageList.vue     # 消息气泡滚动区（原 message.vue）
│   │   │   ├── MessageBubble.vue   # 单条气泡
│   │   │   ├── MessageInput.vue    # 输入区（原 text.vue）
│   │   │   ├── EmojiPicker.vue
│   │   │   ├── MarkdownText.vue    # 原样迁移
│   │   │   ├── VoiceCallModal.vue
│   │   │   └── VideoCallModal.vue
│   │   ├── conversation/
│   │   │   ├── ConversationList.vue
│   │   │   └── ConversationItem.vue
│   │   ├── friend/
│   │   │   ├── FriendList.vue
│   │   │   ├── FriendItem.vue
│   │   │   └── FriendRequest.vue
│   │   ├── group/
│   │   │   ├── GroupInfo.vue
│   │   │   ├── GroupMembers.vue
│   │   │   └── GroupVideoCall.vue
│   │   └── common/
│   │       ├── Avatar.vue
│   │       ├── SearchBar.vue
│   │       ├── PersonalCard.vue
│   │       ├── RelayMessage.vue
│   │       ├── CreateGroup.vue
│   │       └── AboutDialog.vue
│   ├── pages/
│   │   ├── LoginPage.vue
│   │   ├── ChatPage.vue
│   │   └── FriendPage.vue
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   ├── useConversationStore.ts
│   │   ├── useMessageStore.ts
│   │   ├── useFriendStore.ts
│   │   ├── useGroupStore.ts
│   │   ├── useUIStore.ts
│   │   └── useThemeStore.ts
│   ├── services/
│   │   ├── WebSocketService.ts
│   │   └── VoipService.ts
│   ├── websocket/            # 原协议层（.js → .ts，加类型）
│   ├── webrtc/               # 原 WebRTC 层（.js → .ts，加类型）
│   ├── router/
│   │   └── index.ts
│   ├── constant/
│   │   └── index.ts
│   ├── styles/
│   │   ├── variables.css     # CSS Variables 双主题
│   │   └── reset.css
│   ├── App.vue
│   └── main.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 四、UI 设计

### 整体布局

三列布局，宽度分配：`56px | 240px | flex:1`

```
┌──────┬──────────────┬───────────────────────────────────┐
│ 侧边 │   列表区      │           聊天区                   │
│ 56px │   240px      │           flex: 1                 │
│      │              │  ┌─────────────────────────────┐  │
│ 头像 │  搜索框       │  │  顶栏：名称 + 群组/用户信息    │  │
│      │  ──────────  │  ├─────────────────────────────┤  │
│ 导航 │  会话列表     │  │                             │  │
│ 图标 │  (可滚动)    │  │     消息气泡区（可滚动）       │  │
│      │              │  │                             │  │
│ 主题 │              │  ├─────────────────────────────┤  │
│ 切换 │              │  │  工具栏：表情/图片/文件/通话   │  │
│      │              │  │  文本输入框                  │  │
│ 退出 │              │  │  发送按钮                    │  │
└──────┴──────────────┴───────────────────────────────────┘
```

### 双主题配色

```css
[data-theme="dark"] {
  --bg-primary:    #1a1c1e;
  --bg-secondary:  #25282c;
  --bg-tertiary:   #2f3136;
  --bg-chat:       #36393f;
  --bg-bubble-in:  #40444b;
  --bg-bubble-out: #5865f2;
  --text-primary:  #dcddde;
  --text-muted:    #72767d;
  --accent:        #5865f2;
  --accent-green:  #3ba55d;
  --danger:        #ed4245;
  --border:        #42454a;
}

[data-theme="light"] {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f2f3f5;
  --bg-tertiary:   #e3e5e8;
  --bg-chat:       #ffffff;
  --bg-bubble-in:  #f2f3f5;
  --bg-bubble-out: #5865f2;
  --text-primary:  #2e3338;
  --text-muted:    #747f8d;
  --accent:        #5865f2;
  --accent-green:  #3ba55d;
  --danger:        #ed4245;
  --border:        #e3e5e8;
}
```

### 主题切换机制

- 侧边栏底部增加 🌙/☀️ 切换按钮
- 状态存入 `localStorage`，刷新后保持
- 切换时修改 `document.documentElement` 的 `data-theme` 属性
- Naive UI 根节点通过 `n-config-provider :theme` 同步切换

---

## 五、状态管理（Pinia Stores）

### useAuthStore
```
state:   userId, token, deviceId, user{ name, img }
actions: initData(errorHandler), loginOut(), modifyMyInfo(value)
```

### useConversationStore
```
state:   conversations[], selectTarget, searchText, isLoadRemoteMessage
actions: selectConversation(), updateConversationInfo(), topConversation(),
         unTopConversation(), silentConversation(), unSilentConversation(),
         deleteConversation(), clearConversationMessages(), updateConverstationOrder()
getters: searchedConversationList, isSingleConversation
```

### useMessageStore
```
state:   messages[], fileDownloadStatus[], streamingMap, streamingTokenCount,
         pendingReplacementTargets[]
actions: addProtoMessage(), preAddProtoMessage(), updateSendMessage(),
         addOldMessage(), deleteMessage(), updateMessageContent(),
         updateProtoMessageUid(), updateMessageStatus(), appendStreamingContent()
getters: selectedChat, currentMessages
```

### useFriendStore
```
state:   friendlist[], friendIds[], friendDatas[], friendRequests[],
         newFriendRequestCount, searchUsers[]
actions: updateFriendList(), sendFriendAddRequest(), handleFriendRequest(),
         searchUser(), updateSearchUser(), updateFriendIds(), updateFriendRequest()
getters: searchedFriendlist, onlyFriendlist, selectedFriend
```

### useGroupStore
```
state:   groupInfoList[], groupMemberMap, tempGroupMembers[],
         groupOperateState, groupMemberTracker, groupSendMessageUserMap
actions: updateGroupInfos(), getGroupInfo(), getGroupMember(),
         quitGroup(), updateTempGroupMember(), addGroupSendUser()
getters: currentGroupMembers, currentGroupMemberCount
```

### useUIStore
```
state:   showChatBox, showAudioBox, showSearchFriendDialog, showCreateGroupDialog,
         showRelayMessageDialog, showGroupCallVideoDialog, showGroupInfo,
         onlineStatus, appHeight, visibilityState, notify, inCommingNotify,
         outGoingNotify, stateMessageReports[], showMessageRightMenu[],
         currentRightMenuMessage, waitUserIds[], firstLogin, emptyMessage,
         groupCallMembers[], isWinMaxed
actions: setOnlineStatus(), visibilityChange(), addMessageReport(),
         uploadReport(), clearUnreadStatus()
getters: unreadTotalCount
```

### useThemeStore（新增）
```
state:   isDark
actions: toggle()
```

**Store 间通信原则：**
- `WebSocketService` 持有各 store 引用，收到服务端消息后直接调用对应 store action
- store 之间不互相 import
- `LocalStore` 持久化在各 store 的 `watchEffect` 中调用

---

## 六、服务层

### WebSocketService.ts

包装原 `websocketcli.js`，构造函数接收各 store 引用和 errorHandler：

```ts
class WebSocketService {
  constructor(stores: StoreRefs, errorHandler: ErrorHandler)
  connect(token: string, userId: string): void
  sendMessage(fscMessage: FscMessage): void
  uploadReadReport(time: number, target: string, type: ConversationType, userIds?: string[]): void
  uploadDeliveryReport(time: number, target: string): void
  getRemoteMessages(conversation: Conversation, beforeUid: string, count: number): Promise<any>
  getGroupInfo(target: string, refresh: boolean): void
  getGroupMember(groupId: string, refresh: boolean): Promise<any>
  sendFriendAddRequest(value: any): void
  getFriendRequest(version: number): void
  handleFriendRequest(value: any): void
  searchUser(keyword: string): void
  getUserInfo(uid: string): void
  getUserInfos(uids: string[]): void
  modifyMyInfo(value: any): void
  getUploadToken(type: number): void
  getMinioUploadUrl(type: number, key: string): Promise<any>
  recallMessage(messageUid: string): Promise<any>
  sendDisConnectMessage(): void
  quitGroup(groupId: string): void
}
```

### VoipService.ts

包装原 `voipclient.js` + `groupCallClient.js`：

```ts
class VoipService {
  setSessionCallback(cb: SessionCallback): void
  setEngineCallback(cb: EngineCallback): void
  startCall(target: string, audioOnly: boolean): void
  answerCall(audioOnly: boolean): void
  cancelCall(): void
}
```

### 原协议层迁移

| 原路径 | 新路径 | 变更 |
|--------|--------|------|
| `websocket/websocketcli.js` | `websocket/websocketcli.ts` | 加类型 |
| `websocket/chatManager.js` | `websocket/chatManager.ts` | 加类型 |
| `websocket/handler/*.js` | `websocket/handler/*.ts` | store 注入替换 |
| `websocket/message/*.js` | `websocket/message/*.ts` | 加类型 |
| `websocket/model/*.js` | `websocket/model/*.ts` | interface 定义 |
| `websocket/utils/*.js` | `websocket/utils/*.ts` | 加类型 |
| `webrtc/*.js` | `webrtc/*.ts` | 加类型 |

---

## 七、路由

```ts
[
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AppLayout,
    redirect: '/conversation',
    beforeEnter: authGuard,       // 原 permission.js 逻辑
    children: [
      { path: 'conversation', component: ChatPage },
      { path: 'friend', component: FriendPage },
    ]
  }
]
```

---

## 八、关键实现细节

### 上滑加载历史消息
`MessageList.vue` 监听滚动事件，滚动到顶部时调用 `webSocketClient.getRemoteMessages()`，使用 `isLoadRemoteMessage` 标志控制滚动位置保持。

### 流式 AI 消息
`useMessageStore` 保留 `streamingMap` + `pendingReplacementTargets` 逻辑，`MessageBubble` 通过 `:streaming` prop 控制打字光标动画。

### 右键菜单
用 Naive UI `NDropdown` 替换原 `wcPop` 库，支持：撤回、转发、复制、删除。

### 图片预览
用 Naive UI `NImage` 替换原 `v-viewer`，原生支持预览放大。

### Emoji 支持
`EmojiPicker.vue` 独立组件，`MessageBubble` 中解析 emoji 代码替换为图片标签（逻辑原样迁移）。

### 粘贴发图
`MessageInput` 监听 `paste` 事件，检测 clipboard 中的图片文件，直接调用上传流程（逻辑原样迁移）。

### 消息持久化
各 store 用 `watchEffect` 替换原 `store.watch`，调用 `LocalStore` 方法持久化到 `localStorage`。

---

## 九、不在本次范围内

- 后端服务改动
- 高德地图 SDK 升级（原样迁移 vue-amap 或跳过）
- 单元测试
- 移动端适配
