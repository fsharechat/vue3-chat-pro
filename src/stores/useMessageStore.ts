import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { CONVERSATION_MAX_MESSAGE_SIZE } from '@/constant'
import type { StateChatMessage, ProtoMessage } from '@/types'
import { useConversationStore } from './useConversationStore'
import { useUIStore } from './useUIStore'
import { useTranscriptStore } from './useTranscriptStore'
import LocalStore from '@/websocket/store/localstore'
import MessageStatus from '@/websocket/message/messageStatus'
import ProtoConversationInfo from '@/websocket/model/protoConversationInfo'
import UnreadCount from '@/websocket/model/unReadCount'
import MessageConfig from '@/websocket/message/messageConfig'
import RecallMessageNotification from '@/websocket/message/notification/recallMessageNotification'
import MessageContentType from '@/websocket/message/messageContentType'
import webSocketClient from '@/websocket/websocketcli'
import Conversation from '@/websocket/model/conversation'
import WsProtoMessage from '@/websocket/message/protomessage'

// 语音「已播放」上线前本地已有的他人语音都是 Unread，首次加载时一次性置为 Played，避免升级后满屏红点
const VOICE_PLAYED_MIGRATION_KEY = 'voice-played-migrated-v1'

/** 尾部断层：该会话本次增量拉取一条都没下发（服务端 Long.MAX_VALUE） */
export const TAIL_GAP_UID = '9223372036854775807'

/** 已 ack 的消息 uid（字符串形式的 64 位整数）；未 ack（'0'）或流式占位等返回 null */
function ackedUid(m: any): bigint | null {
  const uid = m?.messageUid
  if (typeof uid !== 'string' || !/^[1-9]\d*$/.test(uid)) return null
  return BigInt(uid)
}

function isIncomingVoice(m: ProtoMessage) {
  return m.direction === 1 && m.content?.type === MessageContentType.Voice
}

/**
 * 新插入的他人语音：全量拉取（firstLogin）期间的历史语音直接标已播放，避免满屏红点；
 * 实时收到的交给自动转文字队列（开关判断在 enqueueAuto 内）。
 */
function onVoiceInserted(m: ProtoMessage) {
  if (!isIncomingVoice(m)) return
  if (useUIStore().firstLogin) {
    m.status = MessageStatus.Played
  } else {
    useTranscriptStore().enqueueAuto(m.messageUid)
  }
}

export const useMessageStore = defineStore('message', () => {
  const messages = ref<StateChatMessage[]>([])
  const fileDownloadStatus = ref<any[]>([])
  const streamingMap = ref<Record<string, { target: string; virtualId: string }>>({})
  const streamingTokenCount = ref(0)
  const pendingReplacementTargets = ref<string[]>([])
  const scrollBottomTrigger = ref(0)
  function triggerScrollBottom() { scrollBottomTrigger.value++ }

  const incomingMsgTrigger = ref(0)
  function triggerIncoming() { incomingMsgTrigger.value++ }

  const selectedChat = computed(() => {
    const convStore = useConversationStore()
    const chat = messages.value.find(m => m.target === convStore.selectTarget)
    return chat ?? { name: '', target: convStore.selectTarget, protoMessages: [] }
  })

  const currentMessages = computed(() => selectedChat.value.protoMessages ?? [])

  function addProtoMessage(protoMessage: ProtoMessage) {
    const convStore = useConversationStore()

    // Remove stream placeholder if pending
    const pidx = pendingReplacementTargets.value.indexOf(protoMessage.target)
    if (pidx !== -1) {
      pendingReplacementTargets.value.splice(pidx, 1)
      const chat = messages.value.find(m => m.target === protoMessage.target)
      if (chat) {
        chat.protoMessages = chat.protoMessages.filter(
          (m: any) => !(typeof m.messageId === 'string' && m.messageId.startsWith('stream_'))
        )
      }
      for (const sid of Object.keys(streamingMap.value)) {
        if (streamingMap.value[sid].target === protoMessage.target) {
          delete streamingMap.value[sid]
        }
      }
    }

    let added = false
    let isExist = false
    for (const chat of messages.value) {
      if (chat.target === protoMessage.target) {
        added = true
        const existing = chat.protoMessages.find((m: any) => m.messageId === protoMessage.messageId)
        if (!existing) {
          if (chat.protoMessages.length > CONVERSATION_MAX_MESSAGE_SIZE) {
            chat.protoMessages.splice(0, chat.protoMessages.length - CONVERSATION_MAX_MESSAGE_SIZE)
            convStore.isLoadRemoteMessage = false
          }
          chat.protoMessages.push(protoMessage)
          onVoiceInserted(protoMessage)
          // 收到新消息（direction=1）且是当前会话，通知 MessageList 更新徽标
          if (protoMessage.direction === 1 && protoMessage.target === convStore.selectTarget) {
            triggerIncoming()
          }
        } else {
          if (existing.messageUid === '0') {
            existing.messageUid = protoMessage.messageUid
            existing.status = MessageStatus.Sent
          }
          isExist = true
        }
      }
    }

    if (!added) {
      messages.value.push({ target: protoMessage.target, name: '', protoMessages: [protoMessage] })
      onVoiceInserted(protoMessage)
    }

    if (!isExist) {
      const pci = new ProtoConversationInfo()
      pci.conversationType = protoMessage.conversationType
      pci.target = protoMessage.target
      pci.line = 0
      pci.timestamp = protoMessage.timestamp
      pci.lastMessage = protoMessage
      pci.unreadCount = new UnreadCount()
      convStore.updateConversationInfo(pci)

      // 只有初始拉取完成后（firstLogin=false）才累加未读数，避免历史消息全部计入未读
      const uiStore = useUIStore()
      if (!uiStore.firstLogin && protoMessage.direction === 1) {
        const isCurrentConv = protoMessage.target === convStore.selectTarget
        const isTabVisible = uiStore.visibilityState === 'visible'
        // 非当前会话，或当前会话但 tab 已切走时，均累加未读
        if (!isCurrentConv || !isTabVisible) {
          const sc = convStore.conversations.find(c => c.conversationInfo.target === protoMessage.target)
          const isSilent = sc?.conversationInfo.isSilent ?? false
          // 免打扰时不播放提示音
          if (!isSilent) {
            uiStore.playMsgNotify()
          }
          if (sc) {
            if (!sc.conversationInfo.unreadCount) sc.conversationInfo.unreadCount = new UnreadCount()
            sc.conversationInfo.unreadCount.unread++
          }
        }
      }
    }

    // Auto-delete conversation when group is dismissed
    if (protoMessage.content?.type === MessageContentType.DismissGroup_Notification) {
      setTimeout(() => convStore.deleteConversation(protoMessage.target), 500)
    }

    // Re-fetch group info when name changes so conversation list + chat title sync
    if (protoMessage.content?.type === MessageContentType.ChangeGroupName_Notification) {
      webSocketClient.getGroupInfo(protoMessage.target, false)
    }
  }

  function preAddProtoMessage(protoMessage: ProtoMessage) {
    const convStore = useConversationStore()
    if (!MessageConfig.isDisplayableMessage(protoMessage)) return

    const scIdx = convStore.conversations.findIndex((c: any) => c.conversationInfo.target === protoMessage.target)
    if (scIdx !== -1) {
      const sc = convStore.conversations[scIdx]
      sc.conversationInfo.lastMessage = protoMessage
      sc.conversationInfo.timestamp = protoMessage.timestamp
      convStore.conversations.splice(scIdx, 1)
      convStore.conversations.unshift(sc)
      convStore.updateConverstationOrder()
    }

    let chat = messages.value.find(m => m.target === protoMessage.target)
    if (!chat) {
      chat = { target: protoMessage.target, name: '', protoMessages: [] }
      messages.value.push(chat)
    } else if (chat.protoMessages.length > CONVERSATION_MAX_MESSAGE_SIZE) {
      chat.protoMessages.splice(0, chat.protoMessages.length - CONVERSATION_MAX_MESSAGE_SIZE)
      // Reset so MessageList's length watcher won't try to restore historical scroll position
      useConversationStore().isLoadRemoteMessage = false
    }
    // If a streaming virtual message is already in the list, insert the new outgoing
    // message before it so the streaming bubble stays at the bottom and remains visible.
    const streamingIdx = chat.protoMessages.findIndex(
      (m: any) => typeof m.messageId === 'string' && m.messageId.startsWith('stream_')
    )
    if (streamingIdx !== -1) {
      chat.protoMessages.splice(streamingIdx, 0, protoMessage)
    } else {
      chat.protoMessages.push(protoMessage)
    }
  }

  function addOldMessage(protoMessage: ProtoMessage) {
    const chat = messages.value.find(m => m.target === protoMessage.target)
    if (chat) {
      const exists = chat.protoMessages.find((m: any) => m.messageId === protoMessage.messageId)
      if (!exists) {
        // 上滑加载的是历史消息，多半已在其他端听过，不显示红点
        if (isIncomingVoice(protoMessage)) protoMessage.status = MessageStatus.Played
        chat.protoMessages.unshift(protoMessage)
      }
    }
  }

  /**
   * 增量拉取时服务端截断了该会话：beforeUid 以下的消息未下发，缓存里留着的老消息与新消息之间缺了一段。
   * 丢掉断层以下的缓存，往上翻时自然从断层处拉远程补齐。尾部断层（该会话一条都没下发）清掉全部历史，
   * 返回 true 由调用方立即补拉最新一页；缓存里本来就没有已 ack 的消息时不存在空洞，返回 false。见服务端 docs/superpowers/specs/2026-10-26-conversation-gap-sync-design.md
   */
  function applyConversationGap(target: string, beforeUid: string): boolean {
    const isTail = beforeUid === TAIL_GAP_UID
    const chat = messages.value.find(m => m.target === target)
    if (!chat) return false
    const floor = BigInt(beforeUid)
    const before = chat.protoMessages.length
    chat.protoMessages = chat.protoMessages.filter((m: any) => {
      const uid = ackedUid(m)
      if (uid === null) return true
      return !isTail && uid >= floor
    })
    return isTail && chat.protoMessages.length < before
  }

  /** 尾部断层：从最新开始拉一页（beforeUid 为 '0' 即从最新），服务端降序返回，逐条 unshift 后为升序 */
  async function fillTailGap(conversationType: number, target: string) {
    const data = await webSocketClient.getRemoteMessages(new Conversation(conversationType, target, 0), '0', 20)
    if (!data?.result) return
    const parsed = JSON.parse(data.result)
    for (const raw of parsed.messageResponseList ?? []) addOldMessage(WsProtoMessage.toProtoMessage(raw) as any)
  }

  /** 从 localStorage 恢复消息。首次升级时把已有的他人语音一次性置为已播放 */
  function hydrateMessages(chats: StateChatMessage[]) {
    if (localStorage.getItem(VOICE_PLAYED_MIGRATION_KEY) !== '1') {
      for (const chat of chats) {
        for (const m of chat.protoMessages as ProtoMessage[]) {
          if (isIncomingVoice(m)) m.status = MessageStatus.Played
        }
      }
      localStorage.setItem(VOICE_PLAYED_MIGRATION_KEY, '1')
    }
    messages.value = chats
  }

  /** 他人语音被播放或被点击「转文字」后置为已播放，随 messages 持久化 */
  function markPlayed(messageId: string) {
    for (const chat of messages.value) {
      const m = chat.protoMessages.find((p: any) => p.messageId === messageId)
      if (m) {
        if (m.direction === 1) m.status = MessageStatus.Played
        return
      }
    }
  }

  function deleteMessage(messageId: string) {
    const convStore = useConversationStore()
    const chat = messages.value.find(m => m.target === convStore.selectTarget)
    if (!chat) return
    const idx = chat.protoMessages.findIndex((m: any) => m.messageId === messageId)
    if (idx !== -1) chat.protoMessages.splice(idx, 1)
  }

  function updateMessageContent(notifyMsg: any) {
    for (const chat of messages.value) {
      for (const msg of chat.protoMessages as any[]) {
        if (msg.messageUid === notifyMsg.messageUid) {
          const recall = new RecallMessageNotification(notifyMsg.fromUser, notifyMsg.messageUid)
          msg.content = recall.encode()
          return
        }
      }
    }
  }

  function updateProtoMessageUid(update: { messageId: string; messageUid: string }) {
    for (const chat of messages.value) {
      for (const msg of chat.protoMessages as any[]) {
        if (msg.messageId === update.messageId) {
          msg.messageUid = update.messageUid
          return
        }
      }
    }
  }

  function updateMessageStatus(update: { messageId: string; status: number }) {
    for (const chat of messages.value) {
      for (const msg of chat.protoMessages as any[]) {
        if (msg.messageId === update.messageId) {
          msg.status = update.status
          return
        }
      }
    }
  }

  function appendStreamingContent(payload: { streamId: string; delta: string; isDone: boolean; target: string }) {
    const { streamId, delta, isDone, target } = payload
    if (!streamingMap.value[streamId]) {
      const virtualId = 'stream_' + streamId
      const virtualMsg: any = {
        messageId: virtualId, from: target, target, conversationType: 0,
        direction: 1, content: { type: 1, searchableContent: '' },
        streaming: true, timestamp: Date.now(), status: 1, messageUid: '0', line: 0, tos: ''
      }
      let chat = messages.value.find(m => m.target === target)
      if (!chat) {
        chat = { target, name: target, protoMessages: [] }
        messages.value.push(chat)
      }
      chat.protoMessages.push(virtualMsg)
      streamingMap.value[streamId] = { target, virtualId }
      triggerScrollBottom()
    }

    const entry = streamingMap.value[streamId]
    if (!entry) return
    const chat = messages.value.find(m => m.target === entry.target)
    if (chat) {
      const msg = chat.protoMessages.find((m: any) => m.messageId === entry.virtualId) as any
      if (msg && delta) { msg.content.searchableContent += delta; streamingTokenCount.value++ }
      if (isDone && msg) {
        msg.streaming = false
        if (!pendingReplacementTargets.value.includes(entry.target)) {
          pendingReplacementTargets.value.push(entry.target)
        }
        delete streamingMap.value[streamId]
      }
    }
  }

  function setFileDownloadStatus(status: any) {
    const existing = fileDownloadStatus.value.find((f: any) => f.messageId === status.messageId)
    if (existing) { existing.downloadStatus = status.downloadStatus; existing.downloadPercent = status.downloadPercent }
    else fileDownloadStatus.value.push(status)
  }

  function updateSendMessage(update: { messageId: string; messageContent: any }) {
    for (const chat of messages.value) {
      for (const msg of chat.protoMessages as any[]) {
        if (msg.messageId === update.messageId) {
          msg.content = update.messageContent.encode ? update.messageContent.encode() : update.messageContent
          return
        }
      }
    }
  }

  function reset() {
    messages.value = []
    fileDownloadStatus.value = []
    streamingMap.value = {}
    streamingTokenCount.value = 0
    pendingReplacementTargets.value = []
  }

  watch(messages, val => LocalStore.saveMessages(val), { deep: true })

  return {
    messages, fileDownloadStatus, streamingMap, streamingTokenCount, pendingReplacementTargets,
    selectedChat, currentMessages,
    addProtoMessage, preAddProtoMessage, addOldMessage, deleteMessage, hydrateMessages, markPlayed,
    applyConversationGap, fillTailGap,
    updateMessageContent, updateProtoMessageUid, updateMessageStatus,
    appendStreamingContent, setFileDownloadStatus, updateSendMessage,
    scrollBottomTrigger, triggerScrollBottom,
    incomingMsgTrigger, triggerIncoming,
    reset,
  }
})
