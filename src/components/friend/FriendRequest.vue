<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFriendStore } from '@/stores/useFriendStore'
import { useMessage } from 'naive-ui'
import webSocketClient from '@/websocket/websocketcli'

const friendStore = useFriendStore()
const message = useMessage()
const { friendRequests } = storeToRefs(friendStore)

async function handleRequest(fromUid: string, agree: boolean) {
  try {
    await (webSocketClient as any)._instance?.handleFriendRequest(fromUid, agree ? 1 : 2)
    friendStore.handleFriendRequest({ targetUid: fromUid })
    message.success(agree ? '已同意' : '已拒绝')
  } catch { message.error('操作失败') }
}
</script>

<template>
  <div class="friend-request">
    <div class="req-header">新的朋友</div>
    <div v-if="friendRequests.length === 0" class="empty">暂无好友请求</div>
    <div v-for="req in friendRequests" :key="req.from" class="req-item">
      <img src="/images/vue.jpg" class="req-avatar" />
      <div class="req-info">
        <span class="req-name">{{ req.from }}</span>
        <span class="req-reason">{{ req.reason }}</span>
      </div>
      <div class="req-actions">
        <span v-if="req.status === 1" class="accepted">已添加</span>
        <template v-else>
          <n-button size="small" type="primary" @click="handleRequest(req.from, true)">同意</n-button>
          <n-button size="small" @click="handleRequest(req.from, false)">拒绝</n-button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friend-request { padding: 16px; }
.req-header { font-size: 14px; color: var(--text-muted); margin-bottom: 12px; font-weight: 600; }
.empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0; }
.req-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.req-avatar { width: 40px; height: 40px; border-radius: 6px; }
.req-info { flex: 1; display: flex; flex-direction: column; }
.req-name { font-size: 14px; color: var(--text-primary); }
.req-reason { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.req-actions { display: flex; gap: 8px; }
.accepted { font-size: 12px; color: var(--text-muted); }
</style>
