<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
const props = defineProps<{ userId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()
const uiStore = useUIStore()
const userInfo = uiStore.userInfoList.find((u: any) => u.uid === props.userId)
</script>
<template>
  <div class="personal-card">
    <button class="close" @click="emit('close')">×</button>
    <img :src="authStore.user.img" class="avatar" onerror="this.src='/images/vue.jpg'" />
    <div class="name">{{ userInfo?.displayName ?? authStore.user.name }}</div>
    <div class="uid">ID: {{ props.userId }}</div>
  </div>
</template>
<style scoped>
.personal-card {
  position: absolute; left: 64px; top: 0; z-index: 200;
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 20px 16px; width: 200px;
  box-shadow: 0 4px 20px var(--shadow);
}
.close { position: absolute; top: 8px; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; }
.avatar { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; display: block; margin: 0 auto 10px; }
.name { text-align: center; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.uid { text-align: center; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
</style>
