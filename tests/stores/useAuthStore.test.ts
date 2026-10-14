import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// useAuthStore 会拉起 websocket 与各业务 store，这里把网络与本地存储层替换掉
vi.mock('benz-amr-recorder', () => ({ default: vi.fn() }))
vi.mock('@/websocket/index', () => ({
  default: vi.fn().mockImplementation(() => ({ sendDisConnectMessage: vi.fn() })),
}))
vi.mock('@/websocket/websocketcli', () => ({
  default: { setInstance: vi.fn(), speechToText: vi.fn() },
}))
vi.mock('@/websocket/store/localstore', () => ({
  default: {
    clearLocalStore: vi.fn(),
    getConversations: vi.fn(),
    getFriendRequestVersion: vi.fn(),
    getGroupInfos: vi.fn(),
    getLastMessageSeq: vi.fn(),
    getMessageId: vi.fn(),
    getMessageReports: vi.fn(),
    getMessages: vi.fn(),
    getSelectTarget: vi.fn(),
    getSendMessageCount: vi.fn(),
    getUserId: vi.fn(),
    getUserInfoList: vi.fn(),
    resetSendMessageCount: vi.fn(),
    saveConverSations: vi.fn(),
    saveMessageId: vi.fn(),
    saveMessages: vi.fn(),
    saveUserInfoList: vi.fn(),
    setFriendRequestVersion: vi.fn(),
    setGroupInfos: vi.fn(),
    setLastMessageSeq: vi.fn(),
    setMessageReports: vi.fn(),
    setSelectTarget: vi.fn(),
    setUploadToken: vi.fn(),
    updateSendMessageCount: vi.fn(),
  },
}))

import { useAuthStore } from '@/stores/useAuthStore'
import { useTranscriptStore } from '@/stores/useTranscriptStore'

describe('useAuthStore.loginOut', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('登出时调用 useTranscriptStore().reset()', () => {
    const transcript = useTranscriptStore()
    const reset = vi.spyOn(transcript, 'reset')
    const auth = useAuthStore()

    auth.loginOut()

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
