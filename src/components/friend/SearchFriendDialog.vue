<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFriendStore } from '@/stores/useFriendStore'
import { useUIStore } from '@/stores/useUIStore'
import { useMessage } from 'naive-ui'
import webSocketClient from '@/websocket/websocketcli'

const friendStore = useFriendStore()
const uiStore = useUIStore()
const message = useMessage()
const { searchUsers } = storeToRefs(friendStore)
const { showSearchFriendDialog } = storeToRefs(uiStore)

const searchText = ref('')

async function search() {
  if (!searchText.value.trim()) return
  try {
    await (webSocketClient as any)._instance?.searchUser(searchText.value)
  } catch { message.error('搜索失败') }
}

async function addFriend(uid: string) {
  try {
    await (webSocketClient as any)._instance?.sendFriendAddRequest(uid, '我是' + uid)
    message.success('好友请求已发送')
  } catch { message.error('发送失败') }
}
</script>

<template>
  <n-modal v-model:show="showSearchFriendDialog" title="添加好友" preset="dialog" style="width:400px">
    <n-input-group style="margin-bottom:12px">
      <n-input v-model:value="searchText" placeholder="输入手机号或邮箱搜索" @keydown.enter="search" />
      <n-button type="primary" @click="search">搜索</n-button>
    </n-input-group>
    <div v-for="user in searchUsers" :key="user.uid" class="search-result">
      <img :src="user.portrait || '/images/vue.jpg'" class="sa" onerror="this.src='/images/vue.jpg'" />
      <div class="su-info">
        <span class="su-name">{{ user.displayName }}</span>
        <span class="su-id">{{ user.uid }}</span>
      </div>
      <n-button size="small" type="primary" @click="addFriend(user.uid)">添加</n-button>
    </div>
    <p v-if="searchUsers.length === 0" style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0">暂无搜索结果</p>
  </n-modal>
</template>

<style scoped>
.search-result { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.sa { width: 40px; height: 40px; border-radius: 6px; }
.su-info { flex: 1; display: flex; flex-direction: column; }
.su-name { font-size: 14px; color: var(--text-primary); }
.su-id { font-size: 11px; color: var(--text-muted); }
</style>
