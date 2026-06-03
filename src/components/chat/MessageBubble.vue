<script setup lang="ts">
import { computed } from 'vue'
import type { ProtoMessage } from '@/types'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/useUIStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import MarkdownText from './MarkdownText.vue'
import MessageConfig from '@/websocket/message/messageConfig'
import BenzAMRRecorder from 'benz-amr-recorder'

const props = defineProps<{
  message: ProtoMessage
  prevMessage?: ProtoMessage
}>()

const uiStore = useUIStore()
const convStore = useConversationStore()
const groupStore = useGroupStore()
const { userInfoList, stateMessageReports, emojis } = storeToRefs(uiStore)
const { isSingleConversation } = storeToRefs(convStore)
const { currentGroupMemberCount } = storeToRefs(groupStore)

const isSelf = computed(() => props.message.direction === 0)

const isNotification = computed(() => props.message.content.type >= 80 && props.message.content.type <= 117)
const isRecallNotification = computed(() => props.message.content.type === 84)
const isGroupNotification = computed(() => props.message.content.type >= 80 && props.message.content.type < 84)
const isSystemMsg = computed(() => props.message.content.type === 90)

const notificationText = computed(() => {
  try {
    const mc = MessageConfig.convert2MessageContent(props.message.from, props.message.content) as any
    return mc?.formatNotification?.() ?? mc?.digest?.() ?? ''
  } catch { return '' }
})

const showTimestamp = computed(() => {
  if (!props.prevMessage) return true
  return props.message.timestamp - props.prevMessage.timestamp > 5 * 60 * 1000
})

const avatarSrc = computed(() => {
  const u = userInfoList.value.find((u: any) => u.uid === props.message.from)
  return u?.portrait ?? '/images/vue.jpg'
})

const senderName = computed(() => {
  const u = userInfoList.value.find((u: any) => u.uid === props.message.from)
  return u?.displayName ?? props.message.from
})

const isText = computed(() => props.message.content.type === 1 || props.message.content.type === 0)
const isAudio = computed(() => props.message.content.type === 2)
const isImage = computed(() => props.message.content.type === 3)
const isFile = computed(() => props.message.content.type === 5)
const isVideo = computed(() => props.message.content.type === 6)
const isLocation = computed(() => props.message.content.type === 4)

const textContent = computed(() => {
  if ((props.message as any).streaming) return props.message.content.searchableContent ?? ''
  return props.message.content.searchableContent ?? props.message.content.content ?? ''
})

const thumbnailSrc = computed(() => {
  const b = props.message.content.binaryContent
  return b ? `data:image/png;base64,${b}` : ''
})

const audioInfo = computed(() => {
  try {
    const mc = MessageConfig.convert2MessageContent(props.message.from, props.message.content)
    return { duration: (mc as any).duration ?? 0, url: (mc as any).remotePath ?? '' }
  } catch { return { duration: 0, url: '' } }
})

const fileInfo = computed(() => {
  try {
    const mc = MessageConfig.convert2MessageContent(props.message.from, props.message.content) as any
    const size = mc.size ? `${(mc.size / 1024).toFixed(1)} KB` : ''
    return { name: mc.name ?? '', size, url: mc.remotePath ?? '' }
  } catch { return { name: '', size: '', url: '' } }
})

const messageStatus = computed(() => {
  if (!isSelf.value) return 0
  if (!isSingleConversation.value) return 4
  let status = 3
  const smr = stateMessageReports.value.find((r: any) => r.target === props.message.target)
  if (smr) {
    for (const r of smr.messageReports) {
      if (r.date > props.message.timestamp) {
        if (r.reportType === 2) { status = 2; break }
        else if (r.reportType === 1) status = 1
      }
    }
  }
  return status
})

const readCountText = computed(() => {
  let total = currentGroupMemberCount.value - 1
  const smr = stateMessageReports.value.find((r: any) => r.target === props.message.target)
  if (smr) {
    for (const r of smr.messageReports) {
      if (r.reportType === 2 && r.date > props.message.timestamp) total--
    }
  }
  return total <= 0 ? '全部已读' : `${total}人未读`
})

function formatTime(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

let amrInstance: any = null
function toggleAudio() {
  try {
    if (amrInstance) { amrInstance.stop(); amrInstance = null; return }
    amrInstance = new BenzAMRRecorder()
    amrInstance.initWithUrl(audioInfo.value.url).then(() => amrInstance.play())
    amrInstance.onEnded(() => { amrInstance = null })
  } catch (e) { console.warn('Audio playback error', e) }
}
</script>

<template>
  <div v-if="showTimestamp" class="time-divider">
    <span>{{ formatTime(message.timestamp) }}</span>
  </div>

  <div v-if="isGroupNotification || isRecallNotification || isSystemMsg" class="notification-bar">
    <span>{{ isSystemMsg ? (message.content.content ?? '') : notificationText }}</span>
  </div>

  <div v-else-if="!isNotification" class="message-row" :class="{ self: isSelf }">
    <img class="avatar" :src="avatarSrc" onerror="this.src='/images/vue.jpg'" />
    <div class="bubble-wrap">
      <div v-if="!isSingleConversation && !isSelf" class="sender-name">{{ senderName }}</div>
      <div class="bubble-meta" :class="{ self: isSelf }">
        <div v-if="isSelf" class="read-status">
          <span v-if="messageStatus === 2" class="read">已读</span>
          <span v-else-if="messageStatus === 1" class="delivered">已送达</span>
          <span v-else-if="messageStatus === 3" class="unread">未读</span>
          <span v-else-if="messageStatus === 4" :class="readCountText === '全部已读' ? 'read' : 'unread'">{{ readCountText }}</span>
        </div>
        <div class="bubble" :class="{ 'bubble-self': isSelf, 'bubble-other': !isSelf }">
          <MarkdownText v-if="isText" :content="textContent" :streaming="!!(message as any).streaming" :emojis="emojis" />
          <div v-else-if="isAudio" class="audio-msg" @click="toggleAudio">
            <span class="audio-duration">{{ audioInfo.duration }}"</span>
            <i class="iconfont icon-voice"></i>
          </div>
          <n-image v-else-if="isImage"
            :src="thumbnailSrc || message.content.remoteMediaUrl"
            :preview-src="message.content.remoteMediaUrl ?? thumbnailSrc"
            width="160" style="border-radius:4px;display:block"
          />
          <div v-else-if="isFile" class="file-msg">
            <div class="file-icon"></div>
            <div class="file-info">
              <p class="file-name">{{ fileInfo.name }}</p>
              <p class="file-size">{{ fileInfo.size }}</p>
            </div>
            <a v-if="fileInfo.url" :href="fileInfo.url" target="_blank" class="file-download" title="下载"></a>
          </div>
          <video v-else-if="isVideo"
            :src="message.content.remoteMediaUrl"
            :poster="thumbnailSrc" controls width="250" style="border-radius:4px;max-height:330px"
          ></video>
          <div v-else-if="isLocation" class="location-msg">
            <span>📍 位置消息</span>
          </div>
          <span v-else class="unknown-msg">[不支持的消息类型]</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/fonts/iconfont.css';
.time-divider { text-align: center; margin: 10px 0; font-size: 11px; }
.time-divider span { background: rgba(120,120,120,0.3); color: var(--text-muted); padding: 3px 8px; border-radius: 4px; }
.notification-bar { text-align: center; margin: 6px 0; font-size: 12px; color: var(--text-muted); }
.notification-bar span { background: var(--bg-tertiary); padding: 3px 10px; border-radius: 4px; }
.message-row { display: flex; align-items: flex-start; padding: 6px 12px; gap: 10px; }
.message-row.self { flex-direction: row-reverse; }
.avatar { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.bubble-wrap { display: flex; flex-direction: column; max-width: 70%; }
.sender-name { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; padding-left: 4px; }
.bubble-meta { display: flex; align-items: flex-end; gap: 6px; }
.bubble-meta.self { flex-direction: row-reverse; }
.read-status { font-size: 11px; white-space: nowrap; }
.read { color: var(--text-muted); }
.delivered { color: var(--text-muted); }
.unread { color: var(--accent-green); }
.bubble { padding: 8px 12px; border-radius: 8px; font-size: 14px; line-height: 22px; word-break: break-word; max-width: 100%; }
.bubble-other { background: var(--bg-bubble-in); color: var(--text-primary); }
.bubble-self { background: var(--bg-bubble-out); color: #fff; }
.audio-msg { display: flex; align-items: center; gap: 8px; cursor: pointer; min-width: 60px; }
.audio-duration { font-size: 13px; }
.file-msg { display: flex; align-items: center; gap: 10px; min-width: 200px; max-width: 300px; }
.file-icon { width: 36px; height: 36px; background: #3aa4dd; border-radius: 4px; flex-shrink: 0; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.file-download { width: 24px; height: 24px; flex-shrink: 0; display: inline-block; background: var(--bg-tertiary); border-radius: 4px; }
.location-msg { padding: 4px; cursor: pointer; }
.unknown-msg { font-size: 12px; color: var(--text-muted); font-style: italic; }
</style>
