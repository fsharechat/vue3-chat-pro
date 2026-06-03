<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useMessageStore } from '@/stores/useMessageStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'
import webSocketClient from '@/websocket/websocketcli'
import { SUCCESS_CODE } from '@/constant'
import MessageBubble from './MessageBubble.vue'
import GroupInfo from '@/components/group/GroupInfo.vue'
import Conversation from '@/websocket/model/conversation'
import ProtoMessage from '@/websocket/message/protomessage'
import LocalStore from '@/websocket/store/localstore'

const emit = defineEmits<{ (e: 'context-menu', event: MouseEvent, msg: any): void }>()

const msgStore = useMessageStore()
const convStore = useConversationStore()
const uiStore = useUIStore()
const groupStore = useGroupStore()
const message = useMessage()

const { selectedChat, streamingTokenCount } = storeToRefs(msgStore)
const { selectTarget, isSingleConversation, isLoadRemoteMessage } = storeToRefs(convStore)
const { showGroupInfo } = storeToRefs(uiStore)

const listRef = ref<HTMLElement>()
const isLoading = ref(false)
let prevScrollHeight = 0

function scrollToBottom() {
  nextTick(() => { if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight })
}

watch(() => msgStore.currentMessages.length, () => {
  if (!convStore.isLoadRemoteMessage) scrollToBottom()
  else nextTick(() => { if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight - prevScrollHeight })
})
watch(streamingTokenCount, () => scrollToBottom())
watch(selectTarget, () => { convStore.isLoadRemoteMessage = false; scrollToBottom() })

async function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop > 0 || isLoading.value) return
  isLoading.value = true
  prevScrollHeight = el.scrollHeight
  const firstMsg = selectedChat.value.protoMessages[0] as any
  const beforeUid = firstMsg?.messageUid ?? '0'
  const type = isSingleConversation.value ? 0 : 1
  try {
    const conv = new Conversation(type, selectedChat.value.target, 0)
    const data = await webSocketClient.getRemoteMessages(conv, beforeUid, 20)
    if (data?.result) {
      const parsed = JSON.parse(data.result)
      if (parsed.count > 0) {
        for (const raw of parsed.messageResponseList) msgStore.addOldMessage(ProtoMessage.toProtoMessage(raw) as any)
        convStore.isLoadRemoteMessage = true
      }
    }
  } catch { } finally { isLoading.value = false }
}

async function toggleGroupInfo() {
  if (showGroupInfo.value) { showGroupInfo.value = false; return }
  const data = await (webSocketClient as any)._instance?.getGroupMember(selectedChat.value.target)
  if (data?.code === SUCCESS_CODE) {
    if (!data.result?.length) { message.error('该群组已解散'); convStore.deleteConversation(selectedChat.value.target); return }
    const isMember = data.result.some((m: any) => m.memberId === LocalStore.getUserId())
    if (!isMember) { message.error('您不是群组成员'); convStore.deleteConversation(selectedChat.value.target); return }
    groupStore.groupMemberMap.set(selectedChat.value.target, data.result)
    showGroupInfo.value = true
  }
}
</script>

<template>
  <div class="message-list-container">
    <!-- Header -->
    <div class="msg-header">
      <div class="header-left">
        <span class="chat-name">{{ selectedChat.name || selectedChat.target }}</span>
        <span v-if="!isSingleConversation" class="chat-type-tag">群组</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" title="成员信息" @click="isSingleConversation ? (showGroupInfo = !showGroupInfo) : toggleGroupInfo()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>
      </div>
      <GroupInfo v-if="showGroupInfo && !isSingleConversation" :target-id="selectedChat.target" @close="showGroupInfo = false" />
    </div>

    <!-- Messages -->
    <div class="messages-scroll" ref="listRef" @scroll="onScroll">
      <div v-if="isLoading" class="loading-tip">
        <div class="loading-dot"></div>
        <div class="loading-dot" style="animation-delay:.15s"></div>
        <div class="loading-dot" style="animation-delay:.3s"></div>
      </div>
      <MessageBubble
        v-for="(msg, idx) in selectedChat.protoMessages"
        :key="(msg as any).messageId"
        :message="msg as any"
        :prev-message="idx > 0 ? (selectedChat.protoMessages[idx - 1] as any) : undefined"
        @contextmenu.prevent="(e: MouseEvent) => emit('context-menu', e, msg)"
      />
    </div>
  </div>
</template>

<style scoped>
.message-list-container { display: flex; flex-direction: column; height: 100%; position: relative; }

/* Header */
.msg-header {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-base);
  position: relative;
}
.header-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.chat-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.2px;
}
.chat-type-tag {
  font-size: 10px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-accent);
  flex-shrink: 0;
}
.header-actions { display: flex; gap: 4px; }
.action-btn {
  width: 32px; height: 32px; border: none;
  background: transparent; color: var(--text-muted);
  border-radius: var(--radius-sm); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--dur-normal), color var(--dur-normal);
}
.action-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

/* Messages */
.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0 8px;
  background: var(--bg-base);
}

/* Loading dots */
.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 16px;
}
.loading-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 0.9s ease-in-out infinite;
}
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
