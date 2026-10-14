import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// useMessageStore -> useUIStore -> benz-amr-recorder，jsdom 里跑不起来
vi.mock('benz-amr-recorder', () => ({ default: vi.fn() }))

import { useMessageStore } from '@/stores/useMessageStore'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useUIStore } from '@/stores/useUIStore'

function seed(store: any, protoMessages: any[]) {
  store.messages.push({ target: 'peer-1', name: '', protoMessages })
}

describe('useMessageStore 语音已播放状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function voice(id: string, direction: number, status: number) {
    return {
      messageId: id, messageUid: 'uid-' + id, from: direction === 1 ? 'peer-1' : 'me', target: 'peer-1',
      conversationType: 0, direction, timestamp: 1000, status, line: 0, tos: '',
      content: { type: 2, searchableContent: '' }
    }
  }

  it('markPlayed 把他人语音置为 Played(7)', () => {
    const store = useMessageStore()
    seed(store, [voice('v1', 1, 5)])

    store.markPlayed('v1')

    expect(store.messages[0].protoMessages[0].status).toBe(7)
  })

  it('markPlayed 不改自己发的消息', () => {
    const store = useMessageStore()
    seed(store, [voice('v1', 0, 1)])

    store.markPlayed('v1')

    expect(store.messages[0].protoMessages[0].status).toBe(1)
  })

  it('addOldMessage 加载的他人语音直接视为已播放', () => {
    const store = useMessageStore()
    seed(store, [])
    const old = voice('old', 1, 5)

    store.addOldMessage(old as any)

    expect(store.messages[0].protoMessages[0].status).toBe(7)
  })

  it('hydrateMessages 首次升级把已有的他人语音置为已播放，只做一次', () => {
    const store = useMessageStore()
    store.hydrateMessages([{ target: 'peer-1', name: '', protoMessages: [voice('a', 1, 5), voice('b', 0, 1)] }] as any)

    expect(store.messages[0].protoMessages[0].status).toBe(7)
    expect(store.messages[0].protoMessages[1].status).toBe(1)

    // 迁移标记已写入，之后新收到并持久化的未播放语音不能再被批量置为已播放
    store.hydrateMessages([{ target: 'peer-1', name: '', protoMessages: [voice('c', 1, 5)] }] as any)
    expect(store.messages[0].protoMessages[0].status).toBe(5)
  })

  it('hydrateMessages([]) 也会写入迁移标记，之后的未读语音保持未读', () => {
    const store = useMessageStore()
    store.hydrateMessages([])

    store.hydrateMessages([{ target: 'peer-1', name: '', protoMessages: [voice('d', 1, 5)] }] as any)

    expect(store.messages[0].protoMessages[0].status).toBe(5)
  })
})

describe('useMessageStore 实时语音自动转文字', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function incoming(id: string, type = 2) {
    return {
      messageId: id, messageUid: 'uid-' + id, from: 'peer-1', target: 'peer-1',
      conversationType: 0, direction: 1, timestamp: 1000, status: 5, line: 0, tos: '',
      content: { type, searchableContent: '' }
    }
  }

  function setup(firstLogin: boolean, seedChat = true) {
    const ui = useUIStore()
    ui.setFirstLogin(firstLogin)
    vi.spyOn(ui, 'playMsgNotify').mockImplementation(() => {})
    const ts = useTranscriptStore()
    const spy = vi.spyOn(ts, 'enqueueAuto').mockImplementation(() => {})
    const store = useMessageStore()
    if (seedChat) seed(store, [])
    return { store, spy }
  }

  it('实时收到他人语音时交给 enqueueAuto，状态保持 5', () => {
    const { store, spy } = setup(false)

    store.addProtoMessage(incoming('v1') as any)

    expect(spy).toHaveBeenCalledWith('uid-v1')
    expect(store.messages[0].protoMessages[0].status).toBe(5)
  })

  it('实时收到、该会话尚无记录（!added 分支）也入队', () => {
    const { store, spy } = setup(false, false)

    store.addProtoMessage(incoming('v1') as any)

    expect(spy).toHaveBeenCalledWith('uid-v1')
    expect(store.messages[0].protoMessages[0].status).toBe(5)
  })

  it('firstLogin：已有会话（!existing 分支）标 Played 且不入队', () => {
    const { store, spy } = setup(true)

    store.addProtoMessage(incoming('v1') as any)

    expect(store.messages[0].protoMessages[0].status).toBe(7)
    expect(spy).not.toHaveBeenCalled()
  })

  it('firstLogin：没有会话（!added 分支）标 Played 且不入队', () => {
    const { store, spy } = setup(true, false)

    store.addProtoMessage(incoming('v1') as any)

    expect(store.messages[0].protoMessages[0].status).toBe(7)
    expect(spy).not.toHaveBeenCalled()
  })

  it('同一 messageId 添加两次只入队一次', () => {
    const { store, spy } = setup(false)

    store.addProtoMessage(incoming('v1') as any)
    store.addProtoMessage(incoming('v1') as any)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('非语音、自己发的不自动识别', () => {
    const { store, spy } = setup(false)

    store.addProtoMessage(incoming('t1', 1) as any)
    store.addProtoMessage({ ...incoming('v2'), direction: 0 } as any)

    expect(spy).not.toHaveBeenCalled()
  })
})
