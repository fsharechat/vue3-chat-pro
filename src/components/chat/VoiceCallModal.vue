<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { storeToRefs } from 'pinia'
const uiStore = useUIStore()
const { showAudioBox } = storeToRefs(uiStore)
const callDisplayName = ref('对方')
const callRemoteImg = ref('/images/vue.jpg')
const showTalkTime = ref(false)
const talkTime = ref('00:00')
const rejectCall = ref(false)
const acceptCall = ref(false)
const hangUpCall = ref(false)
const cancelCall = ref(true)
const waitingMsg = ref(true)
const waitingMsgTips = ref('等待对方接听...')
function hangUp() { showAudioBox.value = false }
function cancel() { showAudioBox.value = false }
function reject() { showAudioBox.value = false }
function accept() { rejectCall.value = false; acceptCall.value = false; hangUpCall.value = true; cancelCall.value = false; waitingMsg.value = false }
</script>
<template>
  <div class="voice-modal-overlay">
    <div class="voice-modal">
      <div class="audio-bg"><img :src="callRemoteImg" class="call-bg-avatar" /><div class="bg-overlay"></div></div>
      <div class="audio-main">
        <img :src="callRemoteImg" class="call-avatar" onerror="this.src='/images/vue.jpg'" />
        <p class="call-name">{{ callDisplayName }}</p>
        <p v-if="showTalkTime" class="call-time">{{ talkTime }}</p>
        <p v-if="waitingMsg" class="waiting-tips">{{ waitingMsgTips }}</p>
        <div class="call-ops">
          <button v-if="hangUpCall" class="op-btn cancel-btn" @click="hangUp">挂断</button>
          <div v-else style="display:flex;gap:16px;justify-content:center">
            <button v-if="cancelCall" class="op-btn cancel-btn" @click="cancel">取消</button>
            <button v-if="rejectCall" class="op-btn cancel-btn" @click="reject">拒绝</button>
            <button v-if="acceptCall" class="op-btn accept-btn" @click="accept">接听</button>
          </div>
        </div>
      </div>
      <audio id="wxCallRemoteAudio" autoplay style="display:none"></audio>
    </div>
  </div>
</template>
<style scoped>
.voice-modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); }
.voice-modal { position: relative; width: 280px; height: 344px; border-radius: 12px; overflow: hidden; }
.audio-bg { position: absolute; inset: 0; }
.call-bg-avatar { width: 100%; height: 100%; object-fit: cover; filter: blur(4px); }
.bg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.audio-main { position: relative; z-index: 1; text-align: center; color: #fff; padding-top: 64px; }
.call-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
.call-name { font-size: 16px; margin-bottom: 4px; }
.call-time, .waiting-tips { font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 8px; }
.call-ops { margin-top: 60px; display: flex; justify-content: center; }
.op-btn { padding: 8px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
.cancel-btn { background: #ff6161; color: #fff; }
.accept-btn { background: #39ba70; color: #fff; }
</style>
