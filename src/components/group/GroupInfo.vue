<script setup lang="ts">
import { computed } from 'vue'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { useMessage } from 'naive-ui'
import webSocketClient from '@/websocket/websocketcli'

const props = defineProps<{ targetId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const groupStore = useGroupStore()
const uiStore = useUIStore()
const convStore = useConversationStore()
const message = useMessage()

const groupInfo = computed(() => groupStore.groupInfoList.find(g => g.target === props.targetId))
const members = computed(() => groupStore.groupMemberMap.get(props.targetId) ?? [])

async function quitGroup() {
  try {
    const data = await webSocketClient.quitGroup(props.targetId)
    if (data?.code === 200) { convStore.deleteConversation(props.targetId); emit('close') }
    else message.error('退出失败')
  } catch { message.error('退出失败') }
}

async function dismissGroup() {
  try {
    const data = await webSocketClient.dismissGroup(props.targetId)
    if (data?.code === 200) { convStore.deleteConversation(props.targetId); emit('close') }
    else message.error('解散失败，仅群主可操作')
  } catch { message.error('解散失败') }
}

function getMemberName(uid: string) {
  const u = uiStore.userInfoList.find((u: any) => u.uid === uid)
  return u?.displayName ?? uid
}

function getMemberPortrait(uid: string) {
  const u = uiStore.userInfoList.find((u: any) => u.uid === uid)
  return u?.portrait ?? '/images/vue.jpg'
}
</script>

<template>
  <div class="group-info-panel">
    <div class="group-header">
      <span class="group-name">{{ groupInfo?.name ?? targetId }}</span>
      <span class="member-count">{{ members.length }} 人</span>
      <button class="close-btn" @click="emit('close')">×</button>
    </div>
    <div class="member-grid">
      <div v-for="member in members" :key="member.memberId" class="member-item">
        <img :src="getMemberPortrait(member.memberId)" class="member-avatar" onerror="this.src='/images/vue.jpg'" />
        <span class="member-name">{{ getMemberName(member.memberId) }}</span>
      </div>
    </div>
    <div class="group-actions">
      <n-button size="small" @click="quitGroup">退出群聊</n-button>
      <n-button size="small" type="error" @click="dismissGroup">解散群组</n-button>
    </div>
  </div>
</template>

<style scoped>
.group-info-panel {
  position: absolute; top: 48px; right: 0; z-index: 100;
  width: 280px; background: var(--bg-secondary);
  border: 1px solid var(--border); border-radius: 8px;
  box-shadow: 0 4px 20px var(--shadow); padding: 12px;
}
.group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.group-name { font-size: 15px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.member-count { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px; padding: 0; }
.member-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; max-height: 200px; overflow-y: auto; }
.member-item { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 52px; }
.member-avatar { width: 40px; height: 40px; border-radius: 6px; }
.member-name { font-size: 10px; color: var(--text-muted); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.group-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
