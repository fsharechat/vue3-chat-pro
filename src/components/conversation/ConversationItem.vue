<script setup lang="ts">
import { computed } from 'vue'
import type { StateConversationInfo } from '@/types'
import { useConversationStore } from '@/stores/useConversationStore'

const props = defineProps<{ conversation: StateConversationInfo; isActive: boolean }>()
const convStore = useConversationStore()

const lastMessageText = computed(() => {
  const msg = props.conversation.conversationInfo.lastMessage
  if (!msg) return ''
  return msg.content?.searchableContent || msg.content?.content || ''
})

const timeText = computed(() => {
  const ts = props.conversation.conversationInfo.timestamp
  if (!ts) return ''
  const now = new Date()
  const d = new Date(ts)
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) return `${d.getMonth()+1}月${d.getDate()}日`
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
})

const unread = computed(() => props.conversation.conversationInfo.unreadCount?.unread ?? 0)

function select() { convStore.selectConversation(props.conversation.conversationInfo.target) }
</script>

<template>
  <div class="conv-item" :class="{ active: isActive, unread: unread > 0 }" @click="select">
    <div class="avatar-wrap">
      <img :src="conversation.img" class="avatar" onerror="this.src='/images/vue.jpg'" />
      <span v-if="unread > 0" class="unread-badge">{{ unread > 99 ? '99+' : unread }}</span>
    </div>
    <div class="info">
      <div class="top-row">
        <span class="name">{{ conversation.name || conversation.conversationInfo.target }}</span>
        <span class="time">{{ timeText }}</span>
      </div>
      <div class="preview" :class="{ 'has-unread': unread > 0 }">{{ lastMessageText || '暂无消息' }}</div>
    </div>
  </div>
</template>

<style scoped>
.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 1px 8px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--dur-normal), box-shadow var(--dur-normal);
  position: relative;
}
.conv-item::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 22px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
  transition: transform var(--dur-normal) var(--ease-out);
}
.conv-item:hover { background: var(--bg-elevated); }
.conv-item.active {
  background: var(--accent-subtle);
}
.conv-item.active::before {
  transform: translateY(-50%) scaleY(1);
}

/* Avatar */
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border);
}
.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 600;
  font-family: var(--font-mono);
  line-height: 16px;
  text-align: center;
  border: 1.5px solid var(--bg-overlay);
}

/* Info */
.info { flex: 1; min-width: 0; }
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
}
.name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}
.active .name { color: var(--text-primary); }
.time {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.preview {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
.preview.has-unread { color: var(--text-secondary); font-weight: 500; }
</style>
