<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useConversationStore } from '@/stores/useConversationStore'
import PersonalCard from '@/components/common/PersonalCard.vue'
import AboutDialog from '@/components/common/AboutDialog.vue'
import AddTip from '@/components/common/AddTip.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const themeStore = useThemeStore()
const convStore = useConversationStore()
const { user, userId } = storeToRefs(authStore)
const { onlineStatus, unreadTotalCount } = storeToRefs(uiStore)
const { isDark } = storeToRefs(themeStore)

const showPersonalCard = ref(false)
const showAboutDialog = ref(false)
const showAddTip = ref(false)

function togglePersonalCard() { showPersonalCard.value = !showPersonalCard.value }
function goConversation() { convStore.searchText = ''; router.push('/conversation') }
function goFriend() { convStore.searchText = ''; router.push('/friend') }
function loginOut() { authStore.loginOut() }
</script>

<template>
  <div class="sidebar">
    <div class="avatar-wrap" @click="togglePersonalCard">
      <img :src="user.img" class="avatar" :alt="user.name" onerror="this.src='/images/vue.jpg'" />
      <span class="status-dot" :class="onlineStatus ? 'online' : 'offline'"></span>
    </div>
    <PersonalCard v-if="showPersonalCard" :user-id="userId" @close="showPersonalCard=false" />

    <nav class="nav">
      <div class="nav-item">
        <router-link to="/conversation" class="nav-link" active-class="active" @click="goConversation">
          <span class="badge" v-if="unreadTotalCount > 0">{{ unreadTotalCount > 99 ? '99+' : unreadTotalCount }}</span>
          <i class="iconfont icon-dkw_xiaoxi"></i>
        </router-link>
      </div>
      <div class="nav-item">
        <router-link to="/friend" class="nav-link" active-class="active" @click="goFriend">
          <i class="iconfont icon-pengyou"></i>
        </router-link>
      </div>
      <div class="nav-item" style="position:relative">
        <div class="nav-link" @click="showAddTip = !showAddTip">
          <i class="iconfont icon-jiahaoyou"></i>
        </div>
        <AddTip v-if="showAddTip" @close="showAddTip=false" />
      </div>
    </nav>

    <footer class="footer">
      <button class="icon-btn" :title="isDark ? '切换浅色' : '切换深色'" @click="themeStore.toggle()">
        <span>{{ isDark ? '☀️' : '🌙' }}</span>
      </button>
      <button class="icon-btn about-btn" title="关于" @click="showAboutDialog=true">i</button>
      <div class="nav-link logout-icon" title="退出" @click="loginOut">
        <i class="iconfont icon-tuichu"></i>
      </div>
    </footer>

    <AboutDialog v-if="showAboutDialog" @close="showAboutDialog=false" />
  </div>
</template>

<style scoped>
@import '@/assets/fonts/iconfont.css';
.sidebar {
  display: flex; flex-direction: column; align-items: center;
  width: 60px; height: 100%;
  background: var(--bg-secondary);
  padding: 12px 0; gap: 0; position: relative;
}
.avatar-wrap { position: relative; margin-bottom: 8px; cursor: pointer; }
.avatar { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; display: block; }
.status-dot {
  position: absolute; bottom: -2px; right: -2px;
  width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg-secondary);
}
.online { background: var(--accent-green); }
.offline { background: var(--danger); }
.nav { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 16px; }
.nav-item { position: relative; }
.nav-link {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 8px;
  font-size: 22px; color: var(--text-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s; position: relative;
}
.nav-link:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.nav-link.active { color: var(--accent); background: var(--bg-tertiary); }
.badge {
  position: absolute; top: 2px; right: 2px;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--danger); color: #fff;
  border-radius: 8px; font-size: 10px; line-height: 16px;
  text-align: center; z-index: 1;
}
.footer {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding-bottom: 8px;
}
.icon-btn {
  width: 36px; height: 36px; border: none; background: transparent;
  color: var(--text-muted); cursor: pointer; border-radius: 8px;
  font-size: 16px; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.about-btn {
  font-style: italic; font-family: 'Times New Roman', serif;
  font-weight: bold; font-size: 14px;
  border: 1.5px solid var(--text-muted); border-radius: 50%;
  width: 24px; height: 24px;
}
.logout-icon { font-size: 20px; }
</style>
