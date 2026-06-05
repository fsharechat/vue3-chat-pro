<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/useUIStore'
import { useFriendStore } from '@/stores/useFriendStore'
import { useGroupStore } from '@/stores/useGroupStore'
import webSocketClient from '@/websocket/websocketcli'
import FscMessage from '@/websocket/message/FscMessage'
import Message from '@/websocket/message/message'
import ProtoMessage from '@/websocket/message/protomessage'
import MessageConfig from '@/websocket/message/messageConfig'
import MessageShardingUtil from '@/websocket/utils/MessageShardingUtil'
import LocalStore from '@/websocket/store/localstore'
import Conversation from '@/websocket/model/conversation'
import MessageStatus from '@/websocket/message/messageStatus'
import MessageContentType from '@/websocket/message/messageContentType'
import ConversationType from '@/websocket/model/conversationType'
import { useMessageStore } from '@/stores/useMessageStore'

const uiStore = useUIStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const msgStore = useMessageStore()
const { showRelayMessageDialog } = storeToRefs(uiStore)
const { friendlist } = storeToRefs(friendStore)
const { groupInfoList } = storeToRefs(groupStore)

const innerVisible = ref(false)
const waitRelayMessage = ref('')
const waitRelayImageUrl = ref('')
const contentType = ref(0)
const pendingTarget = ref('')
const pendingName = ref('')
const pendingIsGroup = ref(false)
const pendingContent = ref<any>(null)
const searchText = ref('')

const combinedList = computed(() => {
  const friends = friendlist.value.slice(1).map(f => ({
    target: f.wxid,
    name: f.remark || f.nickname || '',
    img: f.img,
  }))
  const groups = groupInfoList.value.map(g => ({
    target: g.target,
    name: g.name || '',
    img: g.portrait,
  }))
  return [...friends, ...groups]
})

const filteredList = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  if (!kw) return combinedList.value
  return combinedList.value.filter(item => item.name.toLowerCase().includes(kw))
})

function showConfirmDialog(targetWxid: string) {
  const msg = uiStore.currentRightMenuMessage
  if (!msg) return
  const mc = MessageConfig.convert2MessageContent(msg.from, msg.content)
  if (!mc) return

  pendingTarget.value = targetWxid
  pendingIsGroup.value = groupInfoList.value.some(g => g.target === targetWxid)
  const matched = combinedList.value.find(item => item.target === targetWxid)
  pendingName.value = matched?.name ?? ''
  pendingContent.value = mc
  contentType.value = msg.content.type

  if (contentType.value === MessageContentType.Text) {
    waitRelayMessage.value = mc.digest() ?? ''
  } else if (contentType.value === MessageContentType.Image) {
    waitRelayImageUrl.value = mc.thumbnail
      ? `data:image/png;base64,${mc.thumbnail}`
      : mc.remotePath ?? ''
  }

  innerVisible.value = true
}

function sendRelay() {
  try {
    const mc = pendingContent.value
    if (!mc || !pendingTarget.value) return

    const m = new Message()
    const convType = pendingIsGroup.value ? ConversationType.Group : ConversationType.Single
    m.conversation = new Conversation(convType, pendingTarget.value, 0)
    m.from = LocalStore.getUserId()
    m.content = mc
    m.status = MessageStatus.Sending
    m.timestamp = new Date().getTime()
    m.direction = 0
    m.messageId = MessageShardingUtil.generateId()

    const protoMsg = ProtoMessage.convertToProtoMessage(m)
    const fsc = FscMessage.convertToFscMessage(m)
    msgStore.preAddProtoMessage(protoMsg as any)
    ;(webSocketClient as any)._instance?.sendMessage(fsc)

    innerVisible.value = false
    uiStore.showRelayMessageDialog = false
  } catch (e) {
    console.error('[relay] failed', e)
  }
}
</script>

<template>
  <!-- 好友选择弹框 -->
  <n-modal v-model:show="showRelayMessageDialog" title="转发" preset="dialog" style="width:420px">
    <n-input
      v-model:value="searchText"
      placeholder="请输入会话名称"
      clearable
      class="search-input"
    >
      <template #prefix>
        <n-icon size="14" color="var(--text-muted)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </n-icon>
      </template>
    </n-input>
    <div class="relay-list">
      <div
        v-for="item in filteredList"
        :key="item.target"
        class="relay-item"
        @click="showConfirmDialog(item.target)"
      >
        <img :src="item.img" class="ra" onerror="this.src='/images/vue.jpg'" />
        <span>{{ item.name }}</span>
      </div>
      <div v-if="filteredList.length === 0" class="empty-tip">无匹配结果</div>
    </div>
  </n-modal>

  <!-- 消息预览确认弹框（与好友选择弹框同级，不嵌套） -->
  <n-modal v-model:show="innerVisible" :title="`转发给 ${pendingName}`" preset="dialog" style="width:380px">
    <div class="preview">
      <n-input
        v-if="contentType === MessageContentType.Text"
        type="textarea"
        :rows="4"
        :value="waitRelayMessage"
        readonly
      />
      <div v-else-if="contentType === MessageContentType.Image" class="preview-image-wrap">
        <img :src="waitRelayImageUrl" class="preview-image" />
      </div>
      <div v-else-if="contentType === MessageContentType.Video" class="preview-text">[视频]</div>
      <div v-else-if="contentType === MessageContentType.File" class="preview-text">[文件]</div>
      <div v-else-if="contentType === MessageContentType.Location" class="preview-text">[位置]</div>
      <div v-else class="preview-text">[消息]</div>
    </div>
    <template #action>
      <n-button @click="innerVisible = false">取 消</n-button>
      <n-button type="primary" @click="sendRelay">确 定</n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.search-input { margin-bottom: 10px; }
.relay-list { max-height: 300px; overflow-y: auto; }
.relay-item { display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 6px; }
.relay-item:hover { background: var(--bg-tertiary); }
.ra { width: 36px; height: 36px; border-radius: 6px; }
.empty-tip { text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px; }
.preview { padding: 4px 0; }
.preview-image-wrap { text-align: center; }
.preview-image { max-width: 200px; max-height: 280px; border-radius: 4px; }
.preview-text { text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px; }
</style>
