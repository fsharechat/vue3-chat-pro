<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFriendStore } from '@/stores/useFriendStore'
import type { FriendInfo } from '@/types'
import UserAvatar from '@/components/common/UserAvatar.vue'

const friendStore = useFriendStore()
const { searchedFriendlist, selectFriendId } = storeToRefs(friendStore)

function selectFriend(friend: FriendInfo) {
  friendStore.selectFriendId = friend.id
}
</script>

<template>
  <div class="friend-list">
    <template v-for="friend in searchedFriendlist" :key="friend.wxid">
      <div v-if="friend.initial && friend.id !== 0" class="initial-header">{{ friend.initial }}</div>
      <div
        class="friend-item"
        :class="{ active: friend.id === selectFriendId }"
        @click="selectFriend(friend)"
      >
        <UserAvatar :src="friend.img" :name="friend.remark || friend.nickname" :size="38" />
        <div class="friend-info">
          <span class="name">{{ friend.remark || friend.nickname }}</span>
          <span class="signature">{{ friend.signature }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.friend-list { height: 100%; overflow-y: auto; }
.initial-header { padding: 8px 12px 4px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
.friend-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; cursor: pointer; border-radius: 6px;
  margin: 0 8px; transition: background 0.1s;
}
.friend-item:hover { background: var(--bg-tertiary); }
.friend-item.active { background: var(--bg-tertiary); }
.avatar { width: 38px; height: 38px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.friend-info { display: flex; flex-direction: column; min-width: 0; }
.name { font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.signature { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
