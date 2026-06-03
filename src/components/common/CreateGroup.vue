<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGroupStore } from '@/stores/useGroupStore'
import { useFriendStore } from '@/stores/useFriendStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMessage } from 'naive-ui'
import webSocketClient from '@/websocket/websocketcli'

const groupStore = useGroupStore()
const friendStore = useFriendStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const message = useMessage()
const { groupOperateState } = storeToRefs(groupStore)
const { showCreateGroupDialog } = storeToRefs(uiStore)

const groupName = ref('')
const selected = ref<string[]>([authStore.userId])

const friends = computed(() => friendStore.onlyFriendlist)

const title = computed(() => {
  const map: Record<number, string> = { 0: '创建群组', 1: '添加成员', 2: '移除成员', 3: '发起群聊', 4: '发起群视频' }
  return map[groupOperateState.value] ?? '群组操作'
})

function toggleSelect(wxid: string) {
  const idx = selected.value.indexOf(wxid)
  if (idx !== -1) selected.value.splice(idx, 1)
  else selected.value.push(wxid)
}

async function confirm() {
  try {
    const { useConversationStore } = require('@/stores/useConversationStore')
    const convStore = useConversationStore()
    if (groupOperateState.value === 0 || groupOperateState.value === 3) {
      const name = groupName.value.trim() || selected.value.map(id => friendStore.friendlist.find(f => f.wxid === id)?.remark ?? id).join('、')
      const data = await webSocketClient.createGroup(name, selected.value)
      if (data?.code === 200) { message.success('群组创建成功'); uiStore.showCreateGroupDialog = false }
      else message.error('创建失败')
    } else if (groupOperateState.value === 1) {
      const data = await webSocketClient.addMembers(convStore.selectTarget, selected.value)
      if (data?.code === 200) uiStore.showCreateGroupDialog = false
    } else if (groupOperateState.value === 2) {
      const data = await webSocketClient.kickeMembers(convStore.selectTarget, selected.value)
      if (data?.code === 200) uiStore.showCreateGroupDialog = false
    } else if (groupOperateState.value === 4) {
      message.info('群视频通话功能待实现')
      uiStore.showCreateGroupDialog = false
    }
  } catch { message.error('操作失败') }
}
</script>

<template>
  <n-modal v-model:show="showCreateGroupDialog" :title="title" preset="dialog" style="width:440px">
    <n-input v-if="groupOperateState === 0" v-model:value="groupName" placeholder="群组名称（可选，默认用成员名）" style="margin-bottom:12px" />
    <div class="friend-select">
      <div v-for="f in friends" :key="f.wxid" class="friend-option" @click="toggleSelect(f.wxid)">
        <n-checkbox :checked="selected.includes(f.wxid)" />
        <img :src="f.img" class="opt-avatar" onerror="this.src='/images/vue.jpg'" />
        <span>{{ f.remark }}</span>
      </div>
    </div>
    <template #action>
      <n-button @click="uiStore.showCreateGroupDialog = false">取消</n-button>
      <n-button type="primary" :disabled="selected.length < 2" @click="confirm">确认</n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.friend-select { max-height: 300px; overflow-y: auto; }
.friend-option { display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 6px; }
.friend-option:hover { background: var(--bg-tertiary); }
.opt-avatar { width: 32px; height: 32px; border-radius: 4px; }
</style>
