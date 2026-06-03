import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GroupInfo, GroupMember } from '@/types'

export const useGroupStore = defineStore('group', () => {
  const groupInfoList = ref<GroupInfo[]>([])
  const groupMemberMap = ref<Map<string, GroupMember[]>>(new Map())
  const tempGroupMembers = ref<GroupMember[]>([])
  const groupOperateState = ref(0)
  const groupMemberTracker = ref(0)
  const groupSendMessageUserMap = ref<Map<string, string[]>>(new Map())

  const currentGroupMembers = computed(() => {
    const { useConversationStore } = require('@/stores/useConversationStore')
    const target = useConversationStore().selectTarget
    return groupMemberMap.value.get(target) ?? []
  })

  const currentGroupMemberCount = computed(() => {
    const { useConversationStore } = require('@/stores/useConversationStore')
    const target = useConversationStore().selectTarget
    return groupInfoList.value.find(g => g.target === target)?.memberCount ?? 0
  })

  function updateGroupInfos(infos: any[]) {
    for (const info of infos) {
      const idx = groupInfoList.value.findIndex(g => g.target === info.target)
      if (idx !== -1) groupInfoList.value.splice(idx, 1, info)
      else groupInfoList.value.push(info)
    }
    const { useConversationStore } = require('@/stores/useConversationStore')
    useConversationStore().updateConversationIntro(infos)
  }

  function updateTempGroupMember(members: GroupMember[]) {
    tempGroupMembers.value = members
  }

  function addGroupSendUser(info: { target: string; from: string }) {
    const list = groupSendMessageUserMap.value.get(info.target) ?? []
    if (!list.includes(info.from)) list.push(info.from)
    groupSendMessageUserMap.value.set(info.target, list)
  }

  return {
    groupInfoList, groupMemberMap, tempGroupMembers,
    groupOperateState, groupMemberTracker, groupSendMessageUserMap,
    currentGroupMembers, currentGroupMemberCount,
    updateGroupInfos, updateTempGroupMember, addGroupSendUser,
  }
})
