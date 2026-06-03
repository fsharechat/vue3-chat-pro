<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { FriendInfo } from '@/types'
import webSocketClient from '@/websocket/websocketcli'

const props = defineProps<{ friend: FriendInfo }>()
const emit = defineEmits<{ (e: 'send-message'): void }>()
const message = useMessage()

const editing = ref(false)
const remarkInput = ref(props.friend.remark || '')

async function saveRemark() {
  try {
    await webSocketClient.modifyFriendAlias(props.friend.wxid, remarkInput.value)
    editing.value = false
    message.success('备注已更新')
  } catch { message.error('更新失败') }
}
</script>

<template>
  <div class="friend-info">
    <div class="info-header">
      <img :src="friend.img" class="avatar" onerror="this.src='/images/vue.jpg'" />
      <div class="basic">
        <p class="nickname">{{ friend.nickname }}</p>
        <p class="wxid">ID: {{ friend.wxid }}</p>
      </div>
    </div>
    <div class="info-body">
      <div class="info-row">
        <span class="label">备注</span>
        <div v-if="!editing" class="value-row">
          <span class="value">{{ friend.remark || '无' }}</span>
          <button class="edit-btn" @click="editing = true; remarkInput = friend.remark || ''">编辑</button>
        </div>
        <div v-else class="value-row">
          <n-input v-model:value="remarkInput" size="small" style="flex:1" @keydown.enter="saveRemark" />
          <button class="edit-btn" @click="saveRemark">保存</button>
          <button class="edit-btn" @click="editing = false">取消</button>
        </div>
      </div>
      <div v-if="friend.area" class="info-row">
        <span class="label">地区</span>
        <span class="value">{{ friend.area }}</span>
      </div>
      <div v-if="friend.mobile" class="info-row">
        <span class="label">手机</span>
        <span class="value">{{ friend.mobile }}</span>
      </div>
    </div>
    <div class="info-actions">
      <n-button type="primary" @click="emit('send-message')">发消息</n-button>
    </div>
  </div>
</template>

<style scoped>
.friend-info { padding: 32px 24px; }
.info-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.avatar { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; }
.nickname { font-size: 18px; font-weight: 600; color: var(--text-primary); }
.wxid { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.info-body { margin-bottom: 24px; }
.info-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.label { width: 60px; font-size: 13px; color: var(--text-muted); flex-shrink: 0; }
.value { font-size: 13px; color: var(--text-primary); flex: 1; }
.value-row { display: flex; align-items: center; gap: 8px; flex: 1; }
.edit-btn { padding: 3px 10px; border-radius: 4px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; font-size: 12px; }
.edit-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.info-actions { display: flex; gap: 12px; }
</style>
