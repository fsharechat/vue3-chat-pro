<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useMessageStore } from '@/stores/useMessageStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { useUIStore } from '@/stores/useUIStore'
import ConversationList from '@/components/conversation/ConversationList.vue'
import MessageList from '@/components/chat/MessageList.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import RelayMessage from '@/components/common/RelayMessage.vue'
import CreateGroup from '@/components/common/CreateGroup.vue'
import VoiceCallModal from '@/components/chat/VoiceCallModal.vue'
import VideoCallModal from '@/components/chat/VideoCallModal.vue'
import webSocketClient from '@/websocket/websocketcli'
import { SUCCESS_CODE } from '@/constant'
import type { ProtoMessage } from '@/types'

const uiStore = useUIStore()
const msgStore = useMessageStore()
const convStore = useConversationStore()
const message = useMessage()
const { showRelayMessageDialog, showCreateGroupDialog, showChatBox, showAudioBox } = storeToRefs(uiStore)

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMessage = ref<any>(null)

const contextMenuOptions = [
  { label: '撤回消息', key: 'recall' },
  { label: '转发', key: 'relay' },
  { label: '复制文本', key: 'copy' },
  { label: '删除', key: 'delete' },
]

function onContextMenu(e: MouseEvent, msg: any) {
  contextMenuX.value = e.clientX; contextMenuY.value = e.clientY
  contextMessage.value = msg; contextMenuVisible.value = true
}

async function onContextMenuSelect(key: string) {
  contextMenuVisible.value = false
  const msg = contextMessage.value
  if (!msg) return
  if (key === 'recall') {
    try {
      const data = await webSocketClient.recallMessage(msg.messageUid)
      if (data?.code === SUCCESS_CODE && data.result === 200) {
        const LocalStore = require('@/websocket/store/localstore').default
        const RecallMessageNotification = require('@/websocket/message/notification/recallMessageNotification').default
        const recall = new RecallMessageNotification(LocalStore.getUserId(), msg.messageUid)
        msg.content = recall.encode()
      } else { message.error('非管理员只能撤回自己发送的消息') }
    } catch { message.error('撤回失败') }
  } else if (key === 'relay') {
    uiStore.currentRightMenuMessage = msg; uiStore.showRelayMessageDialog = true
  } else if (key === 'copy') {
    try {
      const text = msg.content?.searchableContent ?? msg.content?.content ?? ''
      if (text) navigator.clipboard.writeText(text)
    } catch { message.error('复制失败') }
  } else if (key === 'delete') {
    msgStore.deleteMessage(msg.messageId)
  }
}
</script>

<template>
  <div class="chat-page">
    <aside class="conv-panel">
      <ConversationList />
    </aside>
    <main class="chat-area" v-if="convStore.selectTarget">
      <div class="message-area">
        <MessageList @context-menu="onContextMenu" />
      </div>
      <div class="input-area">
        <MessageInput />
      </div>
    </main>
    <div v-else class="chat-empty">
      <p>选择一个会话开始聊天</p>
    </div>

    <n-dropdown
      :show="contextMenuVisible"
      :options="contextMenuOptions"
      :x="contextMenuX" :y="contextMenuY"
      placement="bottom-start"
      @select="onContextMenuSelect"
      @clickoutside="contextMenuVisible = false"
    />

    <RelayMessage v-if="showRelayMessageDialog" />
    <CreateGroup v-if="showCreateGroupDialog" />
    <VideoCallModal v-if="showChatBox" />
    <VoiceCallModal v-if="showAudioBox" />
  </div>
</template>

<style scoped>
.chat-page { display: flex; height: 100%; overflow: hidden; }
.conv-panel { width: 260px; flex-shrink: 0; border-right: 1px solid var(--border); }
.chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-chat); }
.message-area { flex: 1; min-height: 0; overflow: hidden; }
.input-area { flex-shrink: 0; height: 200px; }
.chat-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; }
</style>
