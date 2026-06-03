<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useMessageStore } from '@/stores/useMessageStore'
import { useConversationStore } from '@/stores/useConversationStore'
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'
import webSocketClient from '@/websocket/websocketcli'
import { SUCCESS_CODE } from '@/constant'
import EmojiPicker from './EmojiPicker.vue'
import SendMessage from '@/websocket/message/sendMessage'
import Message from '@/websocket/message/message'
import ProtoMessage from '@/websocket/message/protomessage'
import FscMessage from '@/websocket/message/FscMessage'
import TextMessageContent from '@/websocket/message/textMessageContent'
import ImageMessageContent from '@/websocket/message/imageMessageContent'
import FileMessageContent from '@/websocket/message/fileMessageContent'
import MessageContentMediaType from '@/websocket/message/messageContentMediaType'
import LocalStore from '@/websocket/store/localstore'
import axios from 'axios'

const msgStore = useMessageStore()
const convStore = useConversationStore()
const uiStore = useUIStore()
const groupStore = useGroupStore()
const message = useMessage()

const { emojis } = storeToRefs(uiStore)

const content = ref('')
const showEmoji = ref(false)
const textareaRef = ref<HTMLTextAreaElement>()
const uploadImgRef = ref<HTMLInputElement>()
const uploadFileRef = ref<HTMLInputElement>()

const sendBtnActive = computed(() => content.value.trim().length > 0)

function buildAndSend(mc: any) {
  try {
    const sm = new SendMessage(convStore.selectTarget, mc)
    const m = Message.conert2Message(sm)
    const protoMsg = ProtoMessage.convertToProtoMessage(m)
    const fscMsg = FscMessage.convertToFscMessage(m)
    msgStore.preAddProtoMessage(protoMsg as any)
    ;(webSocketClient as any)._instance?.sendMessage(fscMsg)
    return protoMsg
  } catch (e) {
    console.error('Send failed', e)
    return null
  }
}

function send() {
  if (!content.value.trim()) { message.warning('不能发送空白信息'); return }
  try {
    const mc = new TextMessageContent(content.value)
    buildAndSend(mc)
    content.value = ''
    textareaRef.value?.focus()
  } catch (e) { console.error('Send text failed', e) }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault(); send()
  } else if (e.key === 'Enter' && e.ctrlKey) {
    content.value += '\n'; e.preventDefault()
  }
}

function pickEmoji(code: string) {
  content.value += code; showEmoji.value = false; textareaRef.value?.focus()
}

async function onImageSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await sendImage(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function sendImage(file: File) {
  try {
    const key = `${MessageContentMediaType.Image}-${LocalStore.getUserId()}-${Date.now()}-${file.name}`
    const data = await webSocketClient.getMinioUploadUrl(MessageContentMediaType.Image, key)
    if (data?.code !== SUCCESS_CODE) return

    const thumbnail = await getImageThumbnail(file)
    const mc = new ImageMessageContent(file, null, thumbnail)
    const protoMsg = buildAndSend(mc)
    if (!protoMsg) return

    await fetch(data.result.url, { method: 'PUT', body: file })
    const remotePath = `${data.result.domain}/${key}`
    const finalMc = new ImageMessageContent(file, remotePath, thumbnail)
    msgStore.updateSendMessage({ messageId: protoMsg.messageId, messageContent: finalMc })
  } catch (e) { console.error('Image send failed', e) }
}

function getImageThumbnail(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = e => {
      const img = new Image()
      img.src = e.target!.result as string
      img.onload = () => {
        const scale = img.width / img.height
        const w = Math.min(img.width * 0.5, 113)
        const h = w / scale
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.5).split(',')[1])
      }
    }
  })
}

async function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const key = `${MessageContentMediaType.File}-${LocalStore.getUserId()}-${Date.now()}-${file.name}`
    const data = await webSocketClient.getMinioUploadUrl(MessageContentMediaType.File, key)
    if (data?.code !== SUCCESS_CODE) return
    const mc = new FileMessageContent(file, '')
    const protoMsg = buildAndSend(mc)
    if (!protoMsg) return
    try {
      await axios.request({
        method: 'PUT', url: data.result.url, data: file,
        onUploadProgress: (p: any) => msgStore.setFileDownloadStatus({ messageId: protoMsg.messageId, downloadStatus: 1, downloadPercent: Math.floor(p.loaded / p.total * 100) })
      })
      msgStore.setFileDownloadStatus({ messageId: protoMsg.messageId, downloadStatus: 2, downloadPercent: 100 })
      msgStore.updateSendMessage({ messageId: protoMsg.messageId, messageContent: new FileMessageContent(file, `${data.result.domain}/${key}`) })
    } catch { message.error('文件上传失败') }
  } catch (e) { console.error('File send failed', e) }
  ;(e.target as HTMLInputElement).value = ''
}

function startAudioCall() {
  if (!convStore.isSingleConversation) return
  uiStore.showAudioBox = true
}

function startVideoCall() {
  if (convStore.isSingleConversation) {
    uiStore.showChatBox = true
  } else {
    uiStore.showCreateGroupDialog = true
    groupStore.groupOperateState = 4
  }
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const blob = item.getAsFile()
      if (blob && blob.size > 0) { sendImage(blob); break }
    }
  }
}
</script>

<template>
  <div class="message-input">
    <div class="toolbar">
      <n-popover v-model:show="showEmoji" trigger="click" placement="top-start" :show-arrow="false" style="padding:0">
        <template #trigger>
          <button class="tool-btn" title="表情"><i class="iconfont icon-biaoqing"></i></button>
        </template>
        <EmojiPicker :emojis="emojis ?? []" @pick="pickEmoji" />
      </n-popover>
      <label class="tool-btn" title="发送图片">
        <i class="iconfont icon-tupian"></i>
        <input ref="uploadImgRef" type="file" accept="image/*" class="hidden-input" @change="onImageSelected" />
      </label>
      <label class="tool-btn" title="发送文件">
        <i class="iconfont icon-wenjian"></i>
        <input ref="uploadFileRef" type="file" class="hidden-input" @change="onFileSelected" />
      </label>
      <button v-if="convStore.isSingleConversation" class="tool-btn" title="语音通话" @click="startAudioCall">
        <i class="iconfont icon-dianhua"></i>
      </button>
      <button class="tool-btn" title="视频通话" @click="startVideoCall">
        <i class="iconfont icon-ai-video"></i>
      </button>
    </div>
    <textarea
      ref="textareaRef"
      v-model="content"
      class="text-input"
      placeholder="输入消息，Enter 发送，Ctrl+Enter 换行"
      @keydown="onKeydown"
      @paste="onPaste"
      @focus="convStore.clearUnreadStatus()"
      @click="showEmoji = false"
    ></textarea>
    <div class="send-row">
      <button class="send-btn" :class="{ active: sendBtnActive }" @click="send">发送</button>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/fonts/iconfont.css';
.message-input { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary); border-top: 1px solid var(--border); }
.toolbar { display: flex; align-items: center; gap: 2px; padding: 6px 12px; border-bottom: 1px solid var(--border); }
.tool-btn {
  position: relative; width: 32px; height: 32px; border: none; background: transparent;
  color: var(--text-muted); cursor: pointer; border-radius: 6px;
  font-size: 18px; display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, color 0.1s;
}
.tool-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.hidden-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; font-size: 0; width: 100%; height: 100%; }
.text-input {
  flex: 1; padding: 10px 14px; background: transparent;
  border: none; outline: none; resize: none;
  color: var(--text-primary); font-size: 14px; font-family: inherit;
  line-height: 1.6;
}
.send-row { display: flex; justify-content: flex-end; padding: 6px 12px 10px; }
.send-btn {
  padding: 6px 20px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg-tertiary); color: var(--text-muted); cursor: pointer;
  font-size: 13px; transition: all 0.15s;
}
.send-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.send-btn.active:hover { background: var(--accent-hover); }
</style>
