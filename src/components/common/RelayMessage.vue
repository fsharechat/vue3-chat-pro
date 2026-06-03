<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/useUIStore'
import { useFriendStore } from '@/stores/useFriendStore'
import webSocketClient from '@/websocket/websocketcli'

const uiStore = useUIStore()
const friendStore = useFriendStore()
const { showRelayMessageDialog } = storeToRefs(uiStore)
const { friendlist } = storeToRefs(friendStore)

function relay(targetWxid: string) {
  const msg = uiStore.currentRightMenuMessage
  if (!msg) return
  try {
    const SendMessage = require('@/websocket/message/sendMessage').default
    const Message = require('@/websocket/message/message').default
    const FscMessage = require('@/websocket/message/FscMessage').default
    const sm = new SendMessage(targetWxid, msg.content)
    const m = Message.conert2Message(sm)
    const fsc = FscMessage.convertToFscMessage(m)
    ;(webSocketClient as any)._instance?.sendMessage(fsc)
    uiStore.showRelayMessageDialog = false
  } catch (e) { console.error('Relay failed', e) }
}
</script>
<template>
  <n-modal v-model:show="showRelayMessageDialog" title="转发消息" preset="dialog" style="width:360px">
    <div class="relay-list">
      <div v-for="f in friendlist.slice(1)" :key="f.wxid" class="relay-item" @click="relay(f.wxid)">
        <img :src="f.img" class="ra" onerror="this.src='/images/vue.jpg'" />
        <span>{{ f.remark || f.nickname }}</span>
      </div>
    </div>
  </n-modal>
</template>
<style scoped>
.relay-list { max-height: 320px; overflow-y: auto; }
.relay-item { display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 6px; }
.relay-item:hover { background: var(--bg-tertiary); }
.ra { width: 36px; height: 36px; border-radius: 6px; }
</style>
