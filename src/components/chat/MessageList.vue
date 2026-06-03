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

const emit = defineEmits<{
  (e: 'context-menu', event: MouseEvent, msg: any): void
}>()

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
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

watch(() => msgStore.currentMessages.length, () => {
  if (!convStore.isLoadRemoteMessage) scrollToBottom()
  else {
    nextTick(() => {
      if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight - prevScrollHeight
    })
  }
})

watch(streamingTokenCount, () => scrollToBottom())

watch(selectTarget, () => {
  convStore.isLoadRemoteMessage = false
  scrollToBottom()
})

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
        for (const raw of parsed.messageResponseList) {
          msgStore.addOldMessage(ProtoMessage.toProtoMessage(raw) as any)
        }
        convStore.isLoadRemoteMessage = true
      }
    }
  } catch (e) {
    console.warn('Load history failed', e)
  } finally {
    isLoading.value = false
  }
}

async function toggleGroupInfo() {
  if (showGroupInfo.value) { showGroupInfo.value = false; return }
  const data = await (webSocketClient as any)._instance?.getGroupMember(selectedChat.value.target)
  if (data?.code === SUCCESS_CODE) {
    if (!data.result || data.result.length === 0) {
      message.error('该群组已解散，即将删除会话')
      convStore.deleteConversation(selectedChat.value.target)
      return
    }
    const isMember = data.result.some((m: any) => m.memberId === LocalStore.getUserId())
    if (!isMember) {
      message.error('您不是群组成员，即将删除会话')
      convStore.deleteConversation(selectedChat.value.target)
      return
    }
    groupStore.groupMemberMap.set(selectedChat.value.target, data.result)
    showGroupInfo.value = true
  }
}
</script>

<template>
  <div class="message-list-container">
    <div class="msg-header">
      <span class="chat-name">{{ selectedChat.name || selectedChat.target }}</span>
      <div class="header-actions">
        <i v-if="!isSingleConversation" class="iconfont icon-pengyou action-icon" title="群组信息" @click="toggleGroupInfo"></i>
        <i v-else class="iconfont icon-pengyou1 action-icon" title="好友信息" @click="showGroupInfo = !showGroupInfo"></i>
      </div>
      <GroupInfo v-if="showGroupInfo && !isSingleConversation" :target-id="selectedChat.target" @close="showGroupInfo = false" />
    </div>
    <div class="messages-scroll" ref="listRef" @scroll="onScroll">
      <div v-if="isLoading" class="loading-tip">
        <n-spin size="small" /> 加载历史消息...
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
@import '@/assets/fonts/iconfont.css';
.message-list-container { display: flex; flex-direction: column; height: 100%; position: relative; }
.msg-header {
  height: 48px; padding: 0 16px; display: flex; align-items: center;
  border-bottom: 1px solid var(--border); flex-shrink: 0; position: relative;
  background: var(--bg-primary);
}
.chat-name { font-size: 16px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-actions { display: flex; gap: 8px; }
.action-icon { font-size: 20px; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
.action-icon:hover { color: var(--text-primary); background: var(--bg-tertiary); }
.messages-scroll { flex: 1; overflow-y: auto; padding: 8px 0; background: var(--bg-chat); }
.loading-tip { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 12px; color: var(--text-muted); }
</style>
