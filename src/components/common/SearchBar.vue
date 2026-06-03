<script setup lang="ts">
import { useConversationStore } from '@/stores/useConversationStore'
const store = useConversationStore()
</script>

<template>
  <div class="search-bar">
    <div class="search-inner">
      <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        v-model="store.searchText"
        class="search-input"
        placeholder="搜索会话"
        type="text"
      />
      <button v-if="store.searchText" class="clear-btn" @click="store.searchText = ''">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar { padding: 8px 12px 10px; }
.search-inner {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0 10px;
  height: 30px;
  transition: border-color var(--dur-normal), box-shadow var(--dur-normal);
}
.search-inner:focus-within {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}
.search-icon { color: var(--text-muted); flex-shrink: 0; }
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 12.5px;
  font-family: var(--font-body);
}
.search-input::placeholder { color: var(--text-muted); }
.clear-btn {
  background: none; border: none;
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  padding: 2px; border-radius: 50%;
  transition: color var(--dur-fast);
}
.clear-btn:hover { color: var(--text-secondary); }
</style>
