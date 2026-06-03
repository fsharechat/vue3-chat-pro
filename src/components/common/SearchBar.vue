<script setup lang="ts">
import { useConversationStore } from '@/stores/useConversationStore'
const store = useConversationStore()
</script>
<template>
  <div class="search-bar">
    <n-input v-model:value="store.searchText" placeholder="搜索" clearable size="small">
      <template #prefix><i class="iconfont icon-search" style="font-size:14px;color:var(--text-muted)"></i></template>
    </n-input>
  </div>
</template>
<style scoped>
@import '@/assets/fonts/iconfont.css';
.search-bar { padding: 8px 12px; background: var(--bg-tertiary); }
</style>
