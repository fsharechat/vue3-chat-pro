<script setup lang="ts">
defineProps<{ emojis: { file: string; code: string; title: string }[] }>()
const emit = defineEmits<{ (e: 'pick', code: string): void }>()
</script>
<template>
  <div class="emoji-picker">
    <img v-for="emoji in emojis" :key="emoji.code"
      :src="`/emoji/${emoji.file}`" :title="emoji.title"
      class="emoji-item" @click="emit('pick', emoji.code)"
    />
  </div>
</template>
<style scoped>
.emoji-picker {
  display: flex; flex-wrap: wrap; width: 280px; max-height: 180px;
  overflow-y: auto; padding: 8px; background: var(--bg-secondary);
  border: 1px solid var(--border); border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow);
}
.emoji-item { width: 28px; height: 28px; cursor: pointer; padding: 2px; border-radius: 4px; }
.emoji-item:hover { background: var(--bg-tertiary); }
</style>
