<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useMessage } from 'naive-ui'
import AppSidebar from './AppSidebar.vue'
import GroupVideoCallModal from '@/components/group/GroupVideoCall.vue'
import SearchFriendDialog from '@/components/friend/SearchFriendDialog.vue'
import CreateGroup from '@/components/common/CreateGroup.vue'

const authStore = useAuthStore()
const uiStore = useUIStore()
const message = useMessage()

function onVisibility() { uiStore.visibilityChange(document.visibilityState) }

onMounted(() => {
  authStore.initData((isError, msg) => {
    if (isError) message.error(msg)
    else message.info(msg)
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
    <SearchFriendDialog v-if="uiStore.showSearchFriendDialog" />
    <CreateGroup v-if="uiStore.showCreateGroupDialog" />
  </div>
</template>

<style scoped>
.app-layout { display: flex; width: 100vw; height: 100vh; background: var(--bg-base); overflow: hidden; }
.sidebar { flex-shrink: 0; }
.main { flex: 1; min-width: 0; overflow: hidden; }
</style>
