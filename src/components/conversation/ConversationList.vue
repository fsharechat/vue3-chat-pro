<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useConversationStore } from '@/stores/useConversationStore'
import SearchBar from '@/components/common/SearchBar.vue'
import ConversationItem from './ConversationItem.vue'

const convStore = useConversationStore()
const { searchedConversationList, selectTarget } = storeToRefs(convStore)
</script>

<template>
  <div class="conv-list-panel">
    <div class="panel-header">
      <span class="panel-title">消息</span>
    </div>
    <SearchBar />
    <div class="list-scroll">
      <ConversationItem
        v-for="conv in searchedConversationList"
        :key="conv.conversationInfo.target"
        :conversation="conv"
        :is-active="conv.conversationInfo.target === selectTarget"
      />
    </div>
  </div>
</template>

<style scoped>
.conv-list-panel { display: flex; flex-direction: column; height: 100%; background: var(--bg-tertiary); }
.panel-header { padding: 16px 12px 8px; }
.panel-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.list-scroll { flex: 1; overflow-y: auto; }
</style>
