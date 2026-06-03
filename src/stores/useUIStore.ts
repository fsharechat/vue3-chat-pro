import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { StateMessageReport, ProtoMessage } from '@/types'

export const useUIStore = defineStore('ui', () => {
  const onlineStatus = ref(false)
  const firstLogin = ref(false)
  const appHeight = ref(638)
  const visibilityState = ref('visible')
  const showChatBox = ref(false)
  const showAudioBox = ref(false)
  const showSearchFriendDialog = ref(false)
  const showCreateGroupDialog = ref(false)
  const showRelayMessageDialog = ref(false)
  const showGroupCallVideoDialog = ref(false)
  const showGroupInfo = ref(false)
  const showMessageRightMenu = ref<any[]>([])
  const currentRightMenuMessage = ref<ProtoMessage | null>(null)
  const waitUserIds = ref<string[]>([])
  const emptyMessage = ref(false)
  const isWinMaxed = ref(false)
  const stateMessageReports = ref<StateMessageReport[]>([])
  const groupCallMembers = ref<any[]>([])
  const userInfoList = ref<any[]>([])
  let _vueSocket: any = null
  let _notify: any = null
  let _inCommingNotify: any = null
  let _outGoingNotify: any = null

  const unreadTotalCount = computed(() => {
    const { useConversationStore } = require('@/stores/useConversationStore')
    const convStore = useConversationStore()
    let total = 0
    for (const sc of convStore.conversations) {
      total += sc.conversationInfo.unreadCount?.unread ?? 0
    }
    if (total === 0) {
      _notify?.faviconClear?.()
      _notify?.setTitle?.()
    } else {
      _notify?.setFavicon?.(total)
      _notify?.setTitle?.('你有新的消息未读')
    }
    return total
  })

  function initNotify() {
    try {
      const Notify = require('@wcjiang/notify').default
      _notify = new Notify({ effect: 'flash', interval: 500, audio: { file: ['audio/notify.mp3'] } })
      _inCommingNotify = new Notify({ audio: { file: ['audio/incoming_call_ring.mp3'] } })
      _outGoingNotify = new Notify({ audio: { file: ['audio/outgoing_call_ring.mp3'] } })
    } catch (e) {
      console.warn('Notify init failed', e)
    }
  }

  function setVueSocket(ws: any) { _vueSocket = ws }
  function setOnlineStatus(status: boolean) { onlineStatus.value = status }
  function setFirstLogin(val: boolean) { firstLogin.value = val }
  function visibilityChange(state: string) { visibilityState.value = state }

  function updateUserInfos(infos: any[]) {
    const { useAuthStore } = require('@/stores/useAuthStore')
    const authStore = useAuthStore()
    for (const info of infos) {
      if (info.uid === authStore.userId) {
        authStore.user.img = info.portrait
        authStore.user.name = info.displayName
      }
      const idx = userInfoList.value.findIndex((u: any) => u.uid === info.uid)
      if (idx !== -1) userInfoList.value.splice(idx, 1, info)
      else userInfoList.value.push(info)
    }
  }

  function addMessageReport(report: any) {
    let sr = stateMessageReports.value.find(r => r.target === report.target)
    if (!sr) {
      sr = { target: report.target, messageReports: [] }
      stateMessageReports.value.push(sr)
    }
    const existing = sr.messageReports.find(r =>
      r.reportType === report.reportType && r.uid === report.uid && r.target === report.target
    )
    if (existing) existing.date = report.date
    else sr.messageReports.push(report)
  }

  function uploadReport(protoMessage: ProtoMessage, vueSocket: any) {
    if (protoMessage.direction !== 1) return
    const { useConversationStore } = require('@/stores/useConversationStore')
    const { useGroupStore } = require('@/stores/useGroupStore')
    const convStore = useConversationStore()
    const groupStore = useGroupStore()

    if (protoMessage.conversationType === 0) {
      vueSocket?.uploadDeliveryReport(Date.now(), protoMessage.target)
    }
    if (convStore.selectTarget === protoMessage.target && visibilityState.value === 'visible') {
      const tos = protoMessage.conversationType === 1
        ? groupStore.groupSendMessageUserMap.get(protoMessage.target)
        : undefined
      vueSocket?.uploadReadReport(Date.now(), protoMessage.target, protoMessage.conversationType, tos)
    }
  }

  return {
    onlineStatus, firstLogin, appHeight, visibilityState,
    showChatBox, showAudioBox, showSearchFriendDialog, showCreateGroupDialog,
    showRelayMessageDialog, showGroupCallVideoDialog, showGroupInfo,
    showMessageRightMenu, currentRightMenuMessage, waitUserIds,
    emptyMessage, isWinMaxed, stateMessageReports, groupCallMembers,
    userInfoList, unreadTotalCount,
    initNotify, setVueSocket, setOnlineStatus, setFirstLogin, visibilityChange,
    updateUserInfos, addMessageReport, uploadReport,
  }
})
