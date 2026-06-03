<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'
const uiStore = useUIStore()
const groupStore = useGroupStore()
</script>
<template>
  <div class="group-video-overlay">
    <div class="group-video-modal">
      <div class="gv-header">
        <span>群组视频通话</span>
        <button class="close-btn" @click="uiStore.showGroupCallVideoDialog = false">×</button>
      </div>
      <div class="members-area">
        <div v-for="member in groupStore.groupCallMembers" :key="member.uid" class="member-video">
          <video :id="`gv-video-${member.uid}`" autoplay playsinline></video>
          <span class="member-label">{{ member.name }}</span>
        </div>
      </div>
      <div class="gv-controls">
        <button class="end-btn" @click="uiStore.showGroupCallVideoDialog = false">结束通话</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.group-video-overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; }
.group-video-modal { width: 700px; height: 500px; background: #1a1a2e; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.gv-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: #fff; font-size: 16px; font-weight: 600; background: rgba(255,255,255,0.05); }
.close-btn { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
.members-area { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; overflow-y: auto; }
.member-video { position: relative; width: 200px; height: 150px; background: #222; border-radius: 8px; overflow: hidden; }
.member-video video { width: 100%; height: 100%; object-fit: cover; }
.member-label { position: absolute; bottom: 6px; left: 8px; color: #fff; font-size: 12px; }
.gv-controls { display: flex; justify-content: center; padding: 12px; }
.end-btn { padding: 8px 32px; border-radius: 8px; border: none; background: #ff6161; color: #fff; cursor: pointer; font-size: 14px; }
</style>
