<script setup lang="ts">
import { computed } from 'vue'
import type { StateConversationInfo } from '@/types'
import { useConversationStore } from '@/stores/useConversationStore'

const props = defineProps<{ conversation: StateConversationInfo; isActive: boolean }>()
const convStore = useConversationStore()

const lastMessageText = computed(() => {
  const msg = props.conversation.conversationInfo.lastMessage
  if (!msg) return ''
  if (msg.content?.searchableContent) return msg.content.searchableContent
  return ''
})

const timeText = computed(() => {
  const ts = props.conversation.conversationInfo.timestamp
  if (!ts) return ''
  const now = new Date()
  const d = new Date(ts)
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  return `${d.getMonth()+1}/${d.getDate()}`
})

const unread = computed(() => props.conversation.conversationInfo.unreadCount?.unread ?? 0)

function select() { convStore.selectConversation(props.conversation.conversationInfo.target) }
</script>

<template>
  <div class="conv-item" :class="{ active: isActive }" @click="select">
    <div class="avatar-wrap">
      <img :src="conversation.img" class="avatar" onerror="this.src='/images/vue.jpg'" />
      <span v-if="unread > 0" class="unread-badge">{{ unread > 99 ? '99+' : unread }}</span>
    </div>
    <div class="info">
      <div class="top-row">
        <span class="name">{{ conversation.name }}</span>
        <span class="time">{{ timeText }}</span>
      </div>
      <div class="preview">{{ lastMessageText }}</div>
    </div>
  </div>
</template>

<style scoped>
.conv-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; cursor: pointer; border-radius: 6px; margin: 2px 8px;
  transition: background 0.1s;
}
.conv-item:hover { background: var(--bg-tertiary); }
.conv-item.active { background: var(--bg-tertiary); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
.unread-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--danger); color: #fff; border-radius: 8px;
  font-size: 10px; line-height: 16px; text-align: center;
}
.info { flex: 1; min-width: 0; }
.top-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
.name { font-size: 14px; color: var(--text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time { font-size: 11px; color: var(--text-muted); flex-shrink: 0; margin-left: 8px; }
.preview { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
