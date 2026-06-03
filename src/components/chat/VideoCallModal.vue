<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { storeToRefs } from 'pinia'
const uiStore = useUIStore()
const { showChatBox } = storeToRefs(uiStore)
const callDisplayName = ref('对方')
const callRemoteImg = ref('/images/vue.jpg')
const showCallRemoteVideo = ref(false)
const showCallLocalVideo = ref(false)
const showTalkTime = ref(false)
const talkTime = ref('00:00')
const cancelCall = ref(true)
const rejectCall = ref(false)
const acceptCall = ref(false)
const hangUpCall = ref(false)
const videoTextCallTips = ref('正在接通，请稍候...')
function hangUp() { showChatBox.value = false }
function cancel() { showChatBox.value = false }
function reject() { showChatBox.value = false }
function accept() { rejectCall.value = false; acceptCall.value = false; hangUpCall.value = true; cancelCall.value = false }
</script>
<template>
  <div class="video-modal-overlay">
    <div class="video-modal">
      <div class="remote-area">
        <video v-show="showCallRemoteVideo" id="wxCallRemoteVideo" autoplay playsinline style="width:100%;height:100%;background:#000"></video>
        <img v-show="!showCallRemoteVideo" :src="callRemoteImg" style="width:100%;height:100%;object-fit:cover;filter:blur(6px)" />
        <p v-show="!showCallRemoteVideo" class="call-tips">{{ videoTextCallTips }}</p>
      </div>
      <div class="local-area">
        <video v-show="showCallLocalVideo" id="wxCallLocalVideo" autoplay muted playsinline style="width:100%;height:100%"></video>
      </div>
      <div class="video-controls">
        <img :src="callRemoteImg" class="ctrl-avatar" onerror="this.src='/images/vue.jpg'" />
        <span class="ctrl-name">{{ callDisplayName }}</span>
        <div v-if="showTalkTime" style="font-size:12px;color:#666;margin-right:12px">{{ talkTime }}</div>
        <button v-if="cancelCall && !hangUpCall" class="ctrl-btn cancel" @click="cancel">取消</button>
        <button v-if="rejectCall" class="ctrl-btn cancel" @click="reject">拒绝</button>
        <button v-if="acceptCall" class="ctrl-btn accept" @click="accept">接听</button>
        <button v-if="hangUpCall" class="ctrl-btn cancel" @click="hangUp">挂断</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.video-modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; }
.video-modal { position: relative; width: 640px; height: 420px; border-radius: 8px; overflow: hidden; background: #000; }
.remote-area { position: absolute; left: 0; top: 0; width: 480px; height: 360px; overflow: hidden; }
.call-tips { position: absolute; top: 50%; left: 0; right: 0; text-align: center; color: #fff; font-size: 14px; transform: translateY(-50%); }
.local-area { position: absolute; right: 0; bottom: 60px; width: 160px; height: 120px; border-radius: 4px; overflow: hidden; background: #111; }
.video-controls { position: absolute; bottom: 0; left: 0; width: 480px; height: 56px; background: #fff; display: flex; align-items: center; padding: 0 16px; gap: 12px; }
.ctrl-avatar { width: 32px; height: 32px; border-radius: 50%; }
.ctrl-name { flex: 1; font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctrl-btn { padding: 5px 14px; border-radius: 5px; border: none; cursor: pointer; font-size: 12px; }
.cancel { background: #ff6161; color: #fff; }
.accept { background: #39ba70; color: #fff; }
</style>
