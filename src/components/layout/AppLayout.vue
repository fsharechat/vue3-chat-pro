<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import AppSidebar from './AppSidebar.vue'
import GroupVideoCallModal from '@/components/group/GroupVideoCall.vue'

const authStore = useAuthStore()
const uiStore = useUIStore()

function onVisibility() { uiStore.visibilityChange(document.visibilityState) }

onMounted(() => {
  authStore.initData((isError, msg) => {
    console.log(isError ? `[ERROR] ${msg}` : `[INFO] ${msg}`)
  })
  document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => document.removeEventListener('visibilitychange', onVisibility))
</script>

<template>
  <div class="app-layout">
    <AppSidebar class="sidebar" />
    <div class="main">
      <router-view />
    </div>
    <GroupVideoCallModal v-if="uiStore.showGroupCallVideoDialog" />
  </div>
</template>

<style scoped>
.app-layout { display: flex; width: 100vw; height: 100vh; background: var(--bg-primary); overflow: hidden; }
.sidebar { flex-shrink: 0; width: 60px; background: var(--bg-secondary); }
.main { flex: 1; min-width: 0; overflow: hidden; }
</style>
